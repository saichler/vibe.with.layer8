package service

import (
	"time"

	"github.com/saichler/l8srlz/go/serialize/object"
	"github.com/saichler/l8types/go/ifs"
	"github.com/saichler/l8utils/go/utils/web"
	"github.com/saichler/vibe.with.layer8/go/types"
)

const (
	ServiceType = "ChatService"
	ServiceName = "chat"
	ServiceArea = byte(0)
)

// ChatService implements ifs.IServiceHandler interface
type ChatService struct {
}

// Activate activates the ChatService
func (this *ChatService) Activate(serviceName string, serviceArea byte, resources ifs.IResources, listener ifs.IServiceCacheListener, args ...interface{}) error {
	resources.Registry().Register(&types.Chat{})
	return nil
}

// DeActivate deactivates the ChatService
func (this *ChatService) DeActivate() error {
	return nil
}

// Post handles POST requests
func (this *ChatService) Post(elements ifs.IElements, vnic ifs.IVNic) ifs.IElements {
	chat, ok := elements.Element().(*types.Chat)
	if ok {
		time.Sleep(time.Second * 5)
	}
	chat.Response = "Got it!"
	return object.New(nil, chat)
}

// Put handles PUT requests
func (this *ChatService) Put(elements ifs.IElements, vnic ifs.IVNic) ifs.IElements {
	return nil
}

// Patch handles PATCH requests
func (this *ChatService) Patch(elements ifs.IElements, vnic ifs.IVNic) ifs.IElements {
	return nil
}

// Delete handles DELETE requests
func (this *ChatService) Delete(elements ifs.IElements, vnic ifs.IVNic) ifs.IElements {
	return nil
}

// GetCopy handles GET requests for copies
func (this *ChatService) GetCopy(elements ifs.IElements, vnic ifs.IVNic) ifs.IElements {
	return nil
}

// Get handles GET requests
func (this *ChatService) Get(elements ifs.IElements, vnic ifs.IVNic) ifs.IElements {
	return nil
}

// Failed handles failed requests
func (this *ChatService) Failed(elements ifs.IElements, vnic ifs.IVNic, message *ifs.Message) ifs.IElements {
	return nil
}

// TransactionConfig returns the transaction configuration
func (this *ChatService) TransactionConfig() ifs.ITransactionConfig {
	return nil
}

// WebService returns the web service
func (this *ChatService) WebService() ifs.IWebService {
	ws := web.New(ServiceName, ServiceArea, &types.Chat{},
		&types.Chat{}, nil, nil, nil, nil, nil, nil, nil, nil)
	return ws
}
