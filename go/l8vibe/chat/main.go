package chat

import (
	"os"

	"github.com/saichler/l8types/go/ifs"
	"github.com/saichler/layer8/go/overlay/vnic"
	"github.com/saichler/vibe.with.layer8/go/l8vibe/chat/service"
	"github.com/saichler/vibe.with.layer8/go/l8vibe/common"
	"github.com/saichler/vibe.with.layer8/go/l8vibe/consts"
)

func main() {
	resources := common.Resources("l8vibe-chat-"+os.Getenv("HOSTNAME"), consts.VNET_PORT)
	resources.Logger().SetLogLevel(ifs.Info_Level)

	nic := vnic.NewVirtualNetworkInterface(resources, nil)
	nic.Resources().SysConfig().KeepAliveIntervalSeconds = 60
	nic.Start()
	nic.WaitForConnection()

	nic.Resources().Registry().Register(&service.ChatService{})
	nic.Resources().Services().Activate(service.ServiceType, "", 0, resources, nil)

	resources.Logger().Info("Chat started!")
	resources.Logger().SetLogLevel(ifs.Error_Level)
	common.WaitForSignal(resources)
}
