package tests

import (
	"fmt"
	"os"
	"testing"

	"github.com/saichler/l8services/go/services/manager"
	"github.com/saichler/l8srlz/go/serialize/object"
	"github.com/saichler/l8types/go/ifs"
	types2 "github.com/saichler/l8types/go/types"
	"github.com/saichler/l8utils/go/utils/logger"
	"github.com/saichler/l8utils/go/utils/registry"
	"github.com/saichler/l8utils/go/utils/resources"
	"github.com/saichler/reflect/go/reflect/introspecting"
	"github.com/saichler/vibe.with.layer8/go/l8vibe/antropic"
	"github.com/saichler/vibe.with.layer8/go/l8vibe/consts"
	"github.com/saichler/vibe.with.layer8/go/types"
	"google.golang.org/protobuf/encoding/protojson"
	"google.golang.org/protobuf/proto"
)

func Resources(alias string, vnetPort uint32) ifs.IResources {
	log := logger.NewLoggerImpl(&logger.FmtLogMethod{})
	log.SetLogLevel(ifs.Error_Level)
	res := resources.NewResources(log)

	res.Set(registry.NewRegistry())

	sec, err := ifs.LoadSecurityProvider()
	if err != nil {
		panic("Failed to load security provider")
	}
	res.Set(sec)

	conf := &types2.SysConfig{MaxDataSize: resources.DEFAULT_MAX_DATA_SIZE,
		RxQueueSize:              resources.DEFAULT_QUEUE_SIZE,
		TxQueueSize:              resources.DEFAULT_QUEUE_SIZE,
		LocalAlias:               alias,
		VnetPort:                 uint32(vnetPort),
		KeepAliveIntervalSeconds: 30}
	res.Set(conf)

	res.Set(introspecting.NewIntrospect(res.Registry()))
	res.Set(manager.NewServices(res))

	return res
}

func TestGenerateProjectsQuery(t *testing.T) {
	res := Resources("test", 22222)
	res.Introspector().Inspect(&types.Project{})
	q, e := object.NewQuery("select * from project where user=<username>", res)
	if e != nil {
		res.Logger().Fail(t, e.Error())
		return
	}
	jsn, err := protojson.Marshal(q.PQuery())
	if err != nil {
		res.Logger().Fail(t, e.Error())
		return
	}
	fmt.Println(string(jsn))
	project := &types.Project{}
	project.User = "<user>"
	project.Description = "<description>"
	project.Name = "<name>"
	project.ApiKey = "<api_key>"
	project.Messages = make([]*types.Message, 0)
	project.Messages = append(project.Messages, &types.Message{Role: "user", Content: "Hello World"})
	project.Messages = append(project.Messages, &types.Message{Role: "assistant", Content: "Have a nice dat"})
	project.Messages = append(project.Messages, &types.Message{Role: "user", Content: "How are you"})
	project.Messages = append(project.Messages, &types.Message{Role: "assistant", Content: "I am fine"})
	jsn, err = protojson.Marshal(project)
	if err != nil {
		res.Logger().Fail(t, e.Error())
		return
	}
	fmt.Println(string(jsn))

}

func testAnthropic(t *testing.T) {
	client := antropic.NewAnthropicClient()
	project := &types.Project{}
	project.User = "saichler@gmail.com"
	project.Name = "hoa"
	project.ApiKey = os.Getenv(consts.ANTHROPIC_ENV)
	project.Description = "HOA sample application"
	err := client.Do("create a website for hoa management. separate javascript and css to separate files.", project)
	if err != nil {
		t.Fail()
		fmt.Println(err)
		return
	}
	data, err := proto.Marshal(project)
	os.WriteFile("project1.data", data, 0777)
}

func TestAnthropicResponse(t *testing.T) {
	lines, err := antropic.ParseAndCreateFiles("project1.data")
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
