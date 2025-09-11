package tests

import (
	"fmt"
	"os"
	"testing"

	"github.com/saichler/vibe.with.layer8/go/l8vibe/chat/service"
	"github.com/saichler/vibe.with.layer8/go/l8vibe/consts"
)

func testAnthropic(t *testing.T) {
	client := service.NewAnthropicClient(os.Getenv(consts.ANTHROPIC_ENV))
	resp, err := client.Do("create a website for hoa management. separate javascript and css to separate files.")
	if err != nil {
		t.Fail()
		fmt.Println(err)
		return
	}
	fmt.Println(resp)
}

func TestAnthropicResponse(t *testing.T) {
	lines, err := service.ParseAndCreateFiles("respond.json", "./workspace")
	if err != nil {
		t.Fail()
		fmt.Println(err)
		return
	}
	if lines != nil {
		for _, line := range lines {
			fmt.Println(line)
		}
	}
}
