package antropic

import (
	"bytes"
	"compress/gzip"
	"crypto/tls"
	"encoding/json"
	"errors"
	"io"
	"net/http"
	"os"
	"strconv"
	"strings"
	"time"

	"github.com/saichler/vibe.with.layer8/go/l8vibe/consts"
	"github.com/saichler/vibe.with.layer8/go/types"
)

type AnthropicClient struct {
	httpClient *http.Client
}

func NewAnthropicClient() *AnthropicClient {
	httpClient := &http.Client{
		Timeout: time.Second * 300,
		Transport: &http.Transport{
			TLSClientConfig: &tls.Config{
				InsecureSkipVerify: true,
				ServerName:         consts.ANTHROPIC_HOST,
			},
		},
	}
	os.Mkdir("responses", 0777)
	return &AnthropicClient{httpClient: httpClient}
}

func (this AnthropicClient) Do(text string, project *types.Project) error {
	body := &types.ClaudeRequest{}
	body.Model = consts.ANTHROPIC_MODEL
	body.MaxTokens = 64000
	body.Messages = project.Messages
	body.Messages = append(body.Messages, &types.Message{Role: "user", Content: text})
	jsonBody, err := json.Marshal(body)
	if err != nil {
		return err
	}

	request, err := http.NewRequest("POST", consts.ANTHROPIC_API, bytes.NewReader(jsonBody))
	if err != nil {
		return err
	}
	request.Header.Set("Content-Type", "application/json")
	request.Header.Set(consts.ANTHROPIC_HEADER_VERSION, consts.ANTHROPIC_HEADER_VERSION_VALUE)
	request.Header.Set(consts.ANTHROPIC_HEADER_API_KEY, project.ApiKey)

	response, err := this.httpClient.Do(request)
	if err != nil {
		return err
	}

	var jsonBytes []byte
	switch response.Header.Get("Content-Encoding") {
	case "gzip":
		reader, _ := gzip.NewReader(response.Body)
		jsonBytes, _ = io.ReadAll(reader)
		defer reader.Close()
	default:
		jsonBytes, _ = io.ReadAll(response.Body)
	}

	ok, err := is200(response.Status)
	if err != nil {
		return err
	}

	if !ok {
		return errors.New("failed with status " + response.Status + ":" + string(jsonBytes))
	}

	resp := &types.ClaudeResponse{}
	err = json.Unmarshal(jsonBytes, resp)
	if err != nil {
		return err
	}

	project.Messages = append(project.Messages,
		&types.Message{Role: "assistant", Content: resp.Content[len(resp.Content)-1].Text})

	return nil
}

func is200(status string) (bool, error) {
	index := strings.Index(status, " ")
	stat, err := strconv.Atoi(status[0:index])
	if err != nil {
		return false, err
	}
	if stat >= 200 && stat <= 299 {
		return true, nil
	}
	return false, nil
}
