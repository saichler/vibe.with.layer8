package service

import (
	"errors"
	"fmt"
	"os"
	"strconv"
	"strings"

	strings2 "github.com/saichler/l8utils/go/utils/strings"
	"github.com/saichler/vibe.with.layer8/go/l8vibe/anthropic"
	"github.com/saichler/vibe.with.layer8/go/types"
)

type AntropicSimulator struct {
	steps []*RequestResponse
	ai    *anthropic.AnthropicClient
}

type RequestResponse struct {
	request string
	respond string
}

func NewAnthropicSimulator() *AntropicSimulator {
	sim := &AntropicSimulator{}
	sim.load()
	sim.ai = anthropic.NewAnthropicClient()
	return sim
}

func (this *AntropicSimulator) load() {
	dir, err := os.ReadDir("./resources")
	if err != nil {
		fmt.Println(err)
		return
	}
	this.steps = make([]*RequestResponse, len(dir)/2)
	for i := range this.steps {
		this.steps[i] = &RequestResponse{}
	}
	for _, file := range dir {
		index := strings.Index(file.Name(), ".")
		loc, _ := strconv.Atoi(file.Name()[:index])
		loc--
		data, _ := os.ReadFile("./resources/" + file.Name())
		if file.Name()[index+1:] == "request" {
			this.steps[loc].request = string(data)
		} else if file.Name()[index+1:] == "respond" {
			this.steps[loc].respond = string(data)
		}
	}
}

func (this *AntropicSimulator) Do(text string, project *types.Project) error {
	if project.Messages == nil {
		project.Messages = make([]*types.Message, 0)
	}
	step := len(project.Messages) / 2
	if step < len(this.steps) {
		msg := &types.Message{}
		msg.Role = "user"
		msg.Content = this.steps[step].request
		project.Messages = append(project.Messages, msg)
		msg = &types.Message{}
		msg.Role = "assistant"
		msg.Content = this.steps[step].respond
		project.Messages = append(project.Messages, msg)
		return anthropic.ParseMessages(project)
	}
	return errors.New("End of Simulation")
	err := this.ai.Do(text, project)
	if err != nil {
		return err
	}
	reqFileName := strings2.New("./resources/", step+2, ".request").String()
	resFileName := strings2.New("./resources/", step+2, ".respond").String()
	os.WriteFile(reqFileName, []byte(text), 0777)
	os.WriteFile(resFileName, []byte(project.Messages[len(project.Messages)-1].Content), 0777)

	anthropic.ParseMessages(project)
	return nil
}
