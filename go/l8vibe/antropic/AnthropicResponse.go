package antropic

import (
	"fmt"
	"os"
	"path/filepath"
	"regexp"
	"strings"

	"github.com/saichler/vibe.with.layer8/go/types"
	"google.golang.org/protobuf/proto"
)

func ParseAndCreateFiles(resposeFilename string) ([]string, error) {
	data, err := os.ReadFile(resposeFilename)
	if err != nil {
		return nil, err
	}

	project := &types.Project{}
	err = proto.Unmarshal(data, project)
	if err != nil {
		return nil, err
	}

	var result []string
	content := project.Messages[len(project.Messages)-1].Content
	lines, e := ParseMessage(content, project)
	if e != nil {
		fmt.Println(e)
		return result, e
	}
	if lines != nil {
		result = append(result, lines...)
	}
	return result, nil
}

func ParseMessages(project *types.Project) error {
	for i, message := range project.Messages {
		if message.Role == "assistant" {
			fmt.Println("Parsing message #", i)
			_, err := ParseMessage(message.Content, project)
			if err != nil {
				return err
			}
		}
	}
	return nil
}

func ParseMessage(text string, project *types.Project) ([]string, error) {
	var result []string

	// Regular expression to match code blocks with file names
	// Matches: ## filename.ext followed by ```language and content until ```
	// Updated to handle format like "## 1. HTML Structure (index.html)"
	codeBlockPattern := regexp.MustCompile(`(?s)##\s+(?:\d+\.\s+)?.*?\(?([\w\-./]+\.\w+)\)?\s*\n` + "```" + `(\w+)?\s*\n(.*?)\n` + "```")

	matches := codeBlockPattern.FindAllStringSubmatch(text, -1)

	if len(matches) == 0 {
		// Try alternative pattern that matches **filename** or Updated filename formats
		altPattern := regexp.MustCompile(`(?s)\*\*(Updated\s+)?([\w\-./]+\.\w+)\*\*.*?\n` + "```" + `(\w+)?\s*\n(.*?)\n` + "```")
		altMatches := altPattern.FindAllStringSubmatch(text, -1)

		// Process matches with the **Updated filename** pattern
		for _, match := range altMatches {
			filename := strings.TrimSpace(match[2])
			content := match[4]
			if err := createFileWithPath(filename, content, project); err != nil {
				return nil, fmt.Errorf("failed to create file %s: %v", filename, err)
			}
			basePath := filepath.Join(".", "web", "workspace", project.User, project.Name)
			result = append(result, fmt.Sprintf("Updated file: %s", filepath.Join(basePath, filename)))
		}

		if len(altMatches) == 0 {
			// Try third pattern that matches the actual format in the sample
			// Matches file structure comments followed by code blocks
			altPattern2 := regexp.MustCompile(`(?s)([\w\-./]+)\s*\n` + "```" + `(\w+)?\s*\n(.*?)\n` + "```")
			altMatches2 := altPattern2.FindAllStringSubmatch(text, -1)

			// Filter matches that look like file names (have extensions)
			for _, match := range altMatches2 {
				filename := strings.TrimSpace(match[1])
				// Clean filename by removing markdown formatting (asterisks, etc.)
				filename = strings.Trim(filename, "*")
				if strings.Contains(filename, ".") && !strings.Contains(filename, " ") {
					content := match[3]
					if err := createFileWithPath(filename, content, project); err != nil {
						return nil, fmt.Errorf("failed to create file %s: %v", filename, err)
					}
					basePath := filepath.Join(".", "web", "workspace", project.User, project.Name)
					result = append(result, fmt.Sprintf("Created file: %s", filepath.Join(basePath, filename)))
				}
			}
		}
	} else {
		// Process the matches found with the primary pattern
		for _, match := range matches {
			filename := match[1]
			content := match[3]

			if err := createFileWithPath(filename, content, project); err != nil {
				return nil, fmt.Errorf("failed to create file %s: %v", filename, err)
			}
			basePath := filepath.Join(".", "web", "workspace", project.User, project.Name)
			result = append(result, fmt.Sprintf("Created file: %s", filepath.Join(basePath, filename)))
		}
	}

	// If no files were created, look for a simpler pattern
	if len(result) == 0 {
		// Look for lines that might indicate files like "index.html", "styles.css", etc.
		lines := strings.Split(text, "\n")
		var currentFile string
		var content strings.Builder
		inCodeBlock := false

		for _, line := range lines {
			trimmedLine := strings.TrimSpace(line)

			// Check if this line looks like a filename
			if !inCodeBlock && strings.Contains(trimmedLine, ".") &&
				!strings.Contains(trimmedLine, " ") &&
				len(strings.Split(trimmedLine, ".")) == 2 {
				// Save previous file if exists
				if currentFile != "" && content.Len() > 0 {
					if err := createFileWithPath(currentFile, content.String(), project); err != nil {
						return nil, fmt.Errorf("failed to create file %s: %v", currentFile, err)
					}
					basePath := filepath.Join(".", "web", "workspace", project.User, project.Name)
					result = append(result, fmt.Sprintf("Created file: %s", filepath.Join(basePath, currentFile)))
				}
				// Clean filename by removing markdown formatting (asterisks, etc.)
				cleanedFilename := strings.Trim(trimmedLine, "*")
				currentFile = cleanedFilename
				content.Reset()
				continue
			}

			// Check for code block markers
			if strings.HasPrefix(trimmedLine, "```") {
				inCodeBlock = !inCodeBlock
				continue
			}

			// Add content if we're in a code block and have a current file
			if inCodeBlock && currentFile != "" {
				content.WriteString(line + "\n")
			}
		}

		// Save the last file
		if currentFile != "" && content.Len() > 0 {
			if err := createFileWithPath(currentFile, content.String(), project); err != nil {
				return nil, fmt.Errorf("failed to create file %s: %v", currentFile, err)
			}
			basePath := filepath.Join(".", "web", "workspace", project.User, project.Name)
			result = append(result, fmt.Sprintf("Created file: %s", filepath.Join(basePath, currentFile)))
		}
	}

	return result, nil
}

func createFileWithPath(filename, content string, project *types.Project) error {
	// Construct the path: ./web/workspace/{user}/{project_name}/{filename}
	basePath := filepath.Join(".", "web", "workspace", project.User, project.Name)
	fullPath := filepath.Join(basePath, filename)

	// Create directory if it doesn't exist
	dir := filepath.Dir(fullPath)
	if err := os.MkdirAll(dir, 0755); err != nil {
		return err
	}

	// Check if file already exists
	if _, err := os.Stat(fullPath); err == nil {
		// File exists - handle update
		return updateFileWithPath(fullPath, content, filename)
	}

	// File doesn't exist - create new file
	return os.WriteFile(fullPath, []byte(content), 0644)
}

func updateFileWithPath(fullPath, newContent, filename string) error {
	// Read existing file content
	existingData, err := os.ReadFile(fullPath)
	if err != nil {
		return err
	}
	existingContent := string(existingData)

	// Detect if this is a partial update or complete replacement
	if isPartialUpdate(newContent, existingContent, filename) {
		// Apply partial update
		updatedContent := applyPartialUpdate(existingContent, newContent, filename)
		return os.WriteFile(fullPath, []byte(updatedContent), 0644)
	}

	// Complete replacement
	return os.WriteFile(fullPath, []byte(newContent), 0644)
}

func isPartialUpdate(newContent, existingContent, filename string) bool {
	// Check if it's a JavaScript file with method updates
	if strings.HasSuffix(filename, ".js") {
		// Look for method/function updates
		if strings.Contains(newContent, "loadSampleData()") &&
			strings.Contains(newContent, "only showing the modified") {
			return true
		}
		// Look for partial function definitions
		if strings.Contains(newContent, "function ") ||
			strings.Contains(newContent, "() {") {
			// Count lines - if significantly smaller than existing, likely partial
			newLines := len(strings.Split(newContent, "\n"))
			existingLines := len(strings.Split(existingContent, "\n"))
			return newLines < existingLines/2
		}
	}

	// Check for other file types with similar patterns
	if strings.Contains(newContent, "Updated") ||
		strings.Contains(newContent, "only showing") ||
		strings.Contains(newContent, "modified") {
		return true
	}

	return false
}

func applyPartialUpdate(existingContent, newContent, filename string) string {
	if strings.HasSuffix(filename, ".js") {
		return applyJavaScriptUpdate(existingContent, newContent)
	}

	// For other file types, default to simple replacement
	return newContent
}

func applyJavaScriptUpdate(existingContent, newContent string) string {
	// Extract method/function updates from newContent
	lines := strings.Split(newContent, "\n")
	var methodStart, methodEnd int
	var methodName string
	var inMethod bool
	var braceCount int

	// Find the method being updated
	for i, line := range lines {
		trimmed := strings.TrimSpace(line)

		// Look for method definition
		if strings.Contains(trimmed, "() {") ||
			(strings.Contains(trimmed, "function ") && strings.Contains(trimmed, "{")) {
			methodStart = i
			methodName = extractMethodName(trimmed)
			inMethod = true
			braceCount = strings.Count(trimmed, "{") - strings.Count(trimmed, "}")
			continue
		}

		if inMethod {
			braceCount += strings.Count(trimmed, "{") - strings.Count(trimmed, "}")
			if braceCount == 0 {
				methodEnd = i
				break
			}
		}
	}

	if methodName == "" {
		return newContent // Fallback to complete replacement
	}

	// Extract the new method content
	newMethodLines := lines[methodStart : methodEnd+1]
	newMethodContent := strings.Join(newMethodLines, "\n")

	// Replace the method in existing content
	return replaceMethodInContent(existingContent, methodName, newMethodContent)
}

func extractMethodName(line string) string {
	// Extract method name from line like "loadSampleData() {" or "function loadSampleData() {"
	if strings.Contains(line, "function ") {
		parts := strings.Split(line, "function ")
		if len(parts) > 1 {
			nameWithParams := strings.Split(parts[1], "(")[0]
			return strings.TrimSpace(nameWithParams)
		}
	} else if strings.Contains(line, "() {") {
		parts := strings.Split(line, "() {")
		if len(parts) > 0 {
			return strings.TrimSpace(parts[0])
		}
	}
	return ""
}

func replaceMethodInContent(content, methodName, newMethodContent string) string {
	lines := strings.Split(content, "\n")
	var result []string
	var inTargetMethod bool
	var braceCount int

	for _, line := range lines {
		trimmed := strings.TrimSpace(line)

		// Check if this is the start of our target method
		if !inTargetMethod && strings.Contains(line, methodName+"()") && strings.Contains(line, "{") {
			inTargetMethod = true
			braceCount = strings.Count(trimmed, "{") - strings.Count(trimmed, "}")

			// If the opening brace is on the same line and closes immediately, handle single-line method
			if braceCount == 0 {
				inTargetMethod = false
				// Replace the entire line with new method content
				newLines := strings.Split(newMethodContent, "\n")
				result = append(result, newLines...)
				continue
			}
			continue
		}

		if inTargetMethod {
			braceCount += strings.Count(trimmed, "{") - strings.Count(trimmed, "}")
			if braceCount == 0 {
				inTargetMethod = false
				// Insert the new method content at the method start position
				newLines := strings.Split(newMethodContent, "\n")
				result = append(result, newLines...)
			}
			// Skip old method content lines
			continue
		}

		// Add non-target method lines
		if !inTargetMethod {
			result = append(result, line)
		}
	}

	return strings.Join(result, "\n")
}
