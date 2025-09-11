package antropic

import (
	"encoding/json"
	"fmt"
	"os"
	"path/filepath"
	"regexp"
	"strings"

	"github.com/saichler/vibe.with.layer8/go/types"
)

func ParseAndCreateFiles(resposeFilename, path string) ([]string, error) {
	data, err := os.ReadFile(resposeFilename)
	if err != nil {
		return nil, err
	}

	resp := &types.ClaudeResponse{}
	err = json.Unmarshal(data, resp)
	if err != nil {
		return nil, err
	}

	var result []string
	content := resp.Content[len(resp.Content)-1]
	lines, e := parseAndCreateFiles(content.Text, path)
	if e != nil {
		fmt.Println(e)
		return result, e
	}
	if lines != nil {
		result = append(result, lines...)
	}
	return result, nil
}

func parseAndCreateFiles(text, path string) ([]string, error) {
	var result []string

	// Regular expression to match code blocks with file names
	// Matches: ## filename.ext followed by ```language and content until ```
	codeBlockPattern := regexp.MustCompile(`(?s)##\s+([\w\-./]+\.\w+)\s*\n` + "```" + `(\w+)?\s*\n(.*?)\n` + "```")

	matches := codeBlockPattern.FindAllStringSubmatch(text, -1)

	if len(matches) == 0 {
		// Try alternative pattern that matches the actual format in the sample
		// Matches file structure comments followed by code blocks
		altPattern := regexp.MustCompile(`(?s)([\w\-./]+)\s*\n` + "```" + `(\w+)?\s*\n(.*?)\n` + "```")
		altMatches := altPattern.FindAllStringSubmatch(text, -1)

		// Filter matches that look like file names (have extensions)
		for _, match := range altMatches {
			filename := strings.TrimSpace(match[1])
			if strings.Contains(filename, ".") && !strings.Contains(filename, " ") {
				content := match[3]
				if err := createFileWithPath(filename, content, path); err != nil {
					return nil, fmt.Errorf("failed to create file %s: %v", filename, err)
				}
				result = append(result, fmt.Sprintf("Created file: %s", filepath.Join(path, filename)))
			}
		}
	} else {
		// Process the matches found with the primary pattern
		for _, match := range matches {
			filename := match[1]
			content := match[3]

			if err := createFileWithPath(filename, content, path); err != nil {
				return nil, fmt.Errorf("failed to create file %s: %v", filename, err)
			}
			result = append(result, fmt.Sprintf("Created file: %s", filepath.Join(path, filename)))
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
					if err := createFileWithPath(currentFile, content.String(), path); err != nil {
						return nil, fmt.Errorf("failed to create file %s: %v", currentFile, err)
					}
					result = append(result, fmt.Sprintf("Created file: %s", filepath.Join(path, currentFile)))
				}
				currentFile = trimmedLine
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
			if err := createFileWithPath(currentFile, content.String(), path); err != nil {
				return nil, fmt.Errorf("failed to create file %s: %v", currentFile, err)
			}
			result = append(result, fmt.Sprintf("Created file: %s", filepath.Join(path, currentFile)))
		}
	}

	return result, nil
}

func createFileWithPath(filename, content, basePath string) error {
	// Combine the base path with the filename
	fullPath := filepath.Join(basePath, filename)

	// Create directory if it doesn't exist
	dir := filepath.Dir(fullPath)
	if err := os.MkdirAll(dir, 0755); err != nil {
		return err
	}

	// Write file
	return os.WriteFile(fullPath, []byte(content), 0644)
}
