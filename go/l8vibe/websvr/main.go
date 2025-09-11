package main

import (
	"os"

	"github.com/saichler/l8types/go/ifs"
	"github.com/saichler/l8types/go/types"
	"github.com/saichler/l8web/go/web/server"
	"github.com/saichler/layer8/go/overlay/health"
	"github.com/saichler/layer8/go/overlay/protocol"
	"github.com/saichler/layer8/go/overlay/vnic"
	"github.com/saichler/vibe.with.layer8/go/l8vibe/common"
	"github.com/saichler/vibe.with.layer8/go/l8vibe/consts"
	types2 "github.com/saichler/vibe.with.layer8/go/types"
)

func main() {
	resources := common.Resources("l8vibe-websvr-"+os.Getenv("HOSTNAME"), consts.VNET_PORT)
	resources.Logger().SetLogLevel(ifs.Info_Level)
	startWebServer(resources)
}

func startWebServer(resources ifs.IResources) {
	serverConfig := &server.RestServerConfig{
		Host:           protocol.MachineIP,
		Port:           consts.WEBSITE_PORT,
		Authentication: false,
		CertName:       consts.WEBSITE_CERT,
		Prefix:         consts.WEBSITE_PREFIX,
	}

	svr, err := server.NewRestServer(serverConfig)
	if err != nil {
		panic(err)
	}

	nic := vnic.NewVirtualNetworkInterface(resources, nil)
	nic.Resources().SysConfig().KeepAliveIntervalSeconds = 60
	nic.Start()
	nic.WaitForConnection()

	registerTypes(resources)

	hs, ok := nic.Resources().Services().ServiceHandler(health.ServiceName, 0)
	if ok {
		ws := hs.WebService()
		svr.RegisterWebService(ws, nic)
	}

	//Activate the webpoints service
	nic.Resources().Services().RegisterServiceHandlerType(&server.WebService{})
	_, err = nic.Resources().Services().Activate(server.ServiceTypeName, ifs.WebService,
		0, nic.Resources(), nic, svr)

	nic.Resources().Logger().Info("Web Server Started!")
	resources.Logger().SetLogLevel(ifs.Error_Level)

	svr.Start()
}

func registerTypes(resources ifs.IResources) {
	resources.Registry().Register(&types.Query{})
	resources.Registry().Register(&types.Top{})
	resources.Registry().Register(&types.Empty{})
	resources.Registry().Register(&types2.Project{})
	resources.Registry().Register(&types2.ProjectList{})
}
