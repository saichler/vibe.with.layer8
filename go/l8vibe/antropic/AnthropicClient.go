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
	apiKey     string
	httpClient *http.Client
}

func NewAnthropicClient(apiKey string) *AnthropicClient {
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
	return &AnthropicClient{apiKey: apiKey, httpClient: httpClient}
}

func (this AnthropicClient) Do(text string) (*http.Response, error) {
	body := &types.ClaudeRequest{}
	body.Model = consts.ANTHROPIC_MODEL
	body.MaxTokens = 64000
	body.Messages = []*types.Message{&types.Message{Role: "user", Content: text}}
	jsonBody, err := json.Marshal(body)
	if err != nil {
		return nil, err
	}

	request, err := http.NewRequest("POST", consts.ANTHROPIC_API, bytes.NewReader(jsonBody))
	if err != nil {
		return nil, err
	}
	request.Header.Set("Content-Type", "application/json")
	request.Header.Set(consts.ANTHROPIC_HEADER_VERSION, consts.ANTHROPIC_HEADER_VERSION_VALUE)
	request.Header.Set(consts.ANTHROPIC_HEADER_API_KEY, this.apiKey)

	response, err := this.httpClient.Do(request)
	if err != nil {
		return nil, err
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
		return nil, err
	}
	if !ok {
		return nil, errors.New("failed with status " + response.Status + ":" + string(jsonBytes))
	}

	os.WriteFile("respond.json", jsonBytes, 0777)

	return response, nil
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
