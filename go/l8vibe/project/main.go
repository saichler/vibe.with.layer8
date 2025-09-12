package main

import (
	"os"

	"github.com/saichler/l8types/go/ifs"
	"github.com/saichler/layer8/go/overlay/vnic"
	"github.com/saichler/vibe.with.layer8/go/l8vibe/common"
	"github.com/saichler/vibe.with.layer8/go/l8vibe/consts"
	"github.com/saichler/vibe.with.layer8/go/l8vibe/project/service"
)

func main() {
	resources := common.Resources("l8vibe-proj-"+os.Getenv("HOSTNAME"), consts.VNET_PORT)
	resources.Logger().SetLogLevel(ifs.Info_Level)

	nic := vnic.NewVirtualNetworkInterface(resources, nil)
	nic.Resources().SysConfig().KeepAliveIntervalSeconds = 60
	nic.Start()
	nic.WaitForConnection()

	nic.Resources().Registry().Register(&service.ProjectService{})
	nic.Resources().Services().Activate(service.ServiceType, service.ServiceName, service.ServiceArea, resources, nic)

	resources.Logger().Info("Project started!")
	resources.Logger().SetLogLevel(ifs.Error_Level)
	common.WaitForSignal(resources)
}
