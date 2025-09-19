package tests

import (
	"fmt"
	"os"
	"testing"

	"github.com/saichler/l8services/go/services/dcache"
	"github.com/saichler/l8services/go/services/manager"
	"github.com/saichler/l8srlz/go/serialize/object"
	"github.com/saichler/l8types/go/ifs"
	"github.com/saichler/l8types/go/types/l8notify"
	"github.com/saichler/l8types/go/types/l8sysconfig"
	"github.com/saichler/l8utils/go/utils/logger"
	"github.com/saichler/l8utils/go/utils/registry"
	"github.com/saichler/l8utils/go/utils/resources"
	"github.com/saichler/reflect/go/reflect/introspecting"
	"github.com/saichler/vibe.with.layer8/go/l8vibe/anthropic"
	"github.com/saichler/vibe.with.layer8/go/l8vibe/consts"
	"github.com/saichler/vibe.with.layer8/go/l8vibe/project/service"
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

	conf := &l8sysconfig.L8SysConfig{MaxDataSize: resources.DEFAULT_MAX_DATA_SIZE,
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
	client := anthropic.NewAnthropicClient()
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
	/*
		data, _ := os.ReadFile("project1.data")
		project := &types.Project{}
		proto.Unmarshal(data, project)
		project.Messages = append(project.Messages, &types.Message{Role: "user", Content: "create a website for hoa management. separate javascript and css to separate files."})
		msg := project.Messages[0]
		project.Messages = project.Messages[1:]
		project.Messages = append(project.Messages, msg)
		data, _ = proto.Marshal(project)
		os.WriteFile("project2.data", data, 0777)
	*/
	lines, err := anthropic.ParseAndCreateFiles("project2.data")
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

func TestAnthropicResponse1(t *testing.T) {
	data, _ := os.ReadFile("design.dat")
	project := &types.Project{}
	proto.Unmarshal(data, project)
	err := anthropic.ParseMessages(project)
	if err != nil {
		t.Fail()
		fmt.Println(err)
		return
	}
}

func TestSimulator(t *testing.T) {
	sim := service.NewAnthropicSimulator()
	project := &types.Project{}
	project.Name = "Test"
	project.User = "User"
	project.ApiKey = os.Getenv(consts.ANTHROPIC_ENV)

	err := sim.Do("test 1", project)
	if err != nil {
		t.Fail()
		fmt.Println(err)
		return
	}
	if len(project.Messages) != 2 || project.Messages[0].Content == "" || project.Messages[1].Content == "" {
		t.Fail()
		fmt.Println("Step 1 failed")
		return
	}
	err = sim.Do("Set the total Residents to be 16", project)
	if err != nil {
		t.Fail()
		fmt.Println(err)
		return
	}
}

type cacheListen struct {
}

func (this *cacheListen) PropertyChangeNotification(set *l8notify.L8NotificationSet) {

}

func TestProjectMessageUpdate(t *testing.T) {
	res := Resources("test", 22222)
	node, _ := res.Introspector().Inspect(&types.Project{})
	introspecting.AddPrimaryKeyDecorator(node, "User", "Name")

	cache := dcache.NewDistributedCacheNoSync("Test", 0, &types.Project{}, nil,
		&cacheListen{}, res)
	project := &types.Project{User: "Test", Name: "Test"}
	cache.Post(project)
	project.Messages = make([]*types.Message, 2)
	project.Messages[0] = &types.Message{Role: "user", Content: "Hello World 1"}
	project.Messages[1] = &types.Message{Role: "user", Content: "Hello World 2"}
	notif, err := cache.Put(project)
	if err != nil {
		t.Fail()
		fmt.Println(err)
		return
	}
	if notif == nil {
		t.Fail()
		fmt.Println("No notification #1")
		return
	}
	project.Messages = append(project.Messages, &types.Message{Role: "user", Content: "Hello World 3"})
	project.Messages = append(project.Messages, &types.Message{Role: "user", Content: "Hello World 4"})

	notif, err = cache.Put(project)
	if err != nil {
		t.Fail()
		fmt.Println(err)
		return
	}
	if notif == nil {
		t.Fail()
		fmt.Println("No notification #2")
		return
	}
}
