package main

import (
	"os"

	"github.com/saichler/l8types/go/ifs"
	"github.com/saichler/layer8/go/overlay/vnet"
	"github.com/saichler/vibe.with.layer8/go/l8vibe/common"
	"github.com/saichler/vibe.with.layer8/go/l8vibe/consts"
)

func main() {
	resources := common.Resources("l8vibe-vnet-"+os.Getenv("HOSTNAME"), consts.VNET_PORT)
	resources.Logger().SetLogLevel(ifs.Info_Level)
	net := vnet.NewVNet(resources)
	net.Start()
	resources.Logger().Info("vnet started!")
	resources.Logger().SetLogLevel(ifs.Error_Level)
	common.WaitForSignal(resources)
}
