package service

import (
	"os"
	strings2 "strings"

	"github.com/saichler/l8services/go/services/dcache"
	"github.com/saichler/l8srlz/go/serialize/object"
	"github.com/saichler/l8types/go/ifs"
	types2 "github.com/saichler/l8types/go/types"
	"github.com/saichler/l8utils/go/utils/strings"
	"github.com/saichler/l8utils/go/utils/web"
	"github.com/saichler/vibe.with.layer8/go/types"
	"google.golang.org/protobuf/proto"
)

const (
	ServiceType = "ProjectService"
	ServiceName = "proj"
	ServiceArea = byte(0)
)

// ProjectService implements ifs.IServiceHandler interface
type ProjectService struct {
	cache ifs.IDistributedCache
}

// Activate activates the ProjectService
func (this *ProjectService) Activate(serviceName string, serviceArea byte, resources ifs.IResources, listener ifs.IServiceCacheListener, args ...interface{}) error {
	resources.Registry().Register(&types.Project{})
	resources.Registry().Register(&types.ProjectList{})
	resources.Registry().Register(&types2.Query{})
	resources.Introspector().Inspect(&types.Project{})
	this.cache = dcache.NewDistributedCache(ServiceName, ServiceArea, "Project", resources.SysConfig().LocalUuid, listener, resources)
	this.load(resources)
	return nil
}

func (this *ProjectService) load(resources ifs.IResources) {
	users, err := os.ReadDir("/data")
	if err != nil {
		resources.Logger().Error("Failed to load users")
		return
	}
	for _, user := range users {
		projects, err := os.ReadDir("/data/" + user.Name())
		if err != nil {
			resources.Logger().Error("Failed to load projects")
			return
		}
		for _, project := range projects {
			if strings2.Contains(project.Name(), ".dat") {
				data, er := os.ReadFile("/data/" + user.Name() + "/" + project.Name())
				if er != nil {
					resources.Logger().Error("#1 Failed to load project " + project.Name())
					continue
				}
				proj := &types.Project{}
				er = proto.Unmarshal(data, proj)
				if er != nil {
					resources.Logger().Error("#2 Failed to load project " + project.Name())
					continue
				}
				key := strings.New(proj.User, proj.Name).String()
				this.cache.Put(key, proj, true)
				resources.Logger().Info("Loaded project " + project.Name())
			}
		}
	}
}

// DeActivate deactivates the ProjectService
func (this *ProjectService) DeActivate() error {
	return nil
}

// Post handles POST requests
func (this *ProjectService) Post(elements ifs.IElements, vnic ifs.IVNic) ifs.IElements {
	project, ok := elements.Element().(*types.Project)
	if ok {
		key := strings.New(project.User, project.Name).String()
		this.cache.Post(key, project, elements.Notification())

		data, err := proto.Marshal(project)
		if err != nil {
			return object.NewError(vnic.Resources().Logger().Error("Post Error 1:", err.Error()).Error())
		}

		projectPath := strings.New("/data/", project.User, "/").String()
		err = os.MkdirAll(projectPath, 0777)
		if err != nil {
			return object.NewError(vnic.Resources().Logger().Error("Post Error 0:", err.Error()).Error())
		}

		projectFileName := strings.New(projectPath, project.Name, ".dat").String()
		err = os.WriteFile(projectFileName, data, 0777)
		if err != nil {
			return object.NewError(vnic.Resources().Logger().Error("Post Error 2:", err.Error()).Error())
		}
	}
	return object.New(nil, project)
}

// Put handles PUT requests
func (this *ProjectService) Put(elements ifs.IElements, vnic ifs.IVNic) ifs.IElements {
	return nil
}

// Patch handles PATCH requests
func (this *ProjectService) Patch(elements ifs.IElements, vnic ifs.IVNic) ifs.IElements {
	return nil
}

// Delete handles DELETE requests
func (this *ProjectService) Delete(elements ifs.IElements, vnic ifs.IVNic) ifs.IElements {
	return nil
}

// GetCopy handles GET requests for copies
func (this *ProjectService) GetCopy(elements ifs.IElements, vnic ifs.IVNic) ifs.IElements {
	return nil
}

// Get handles GET requests
func (this *ProjectService) Get(elements ifs.IElements, vnic ifs.IVNic) ifs.IElements {
	if elements.IsFilterMode() {
		project, ok := elements.Element().(*types.Project)
		if ok {
			key := strings.New(project.User, project.Name).String()
			elem := this.cache.Get(key)
			return object.New(nil, elem)
		}
	}

	query, err := elements.Query(vnic.Resources())
	if err != nil {
		return object.NewError(err.Error())
	}
	elems := this.GetQuery(query)
	vnic.Resources().Logger().Info("Get Completed with ", len(elems), " elements for query:")
	return object.New(nil, elems)
}

func (this *ProjectService) GetQuery(query ifs.IQuery) []interface{} {
	result := make([]interface{}, 0)
	this.cache.Collect(func(elem interface{}) (bool, interface{}) {
		match := query.Match(elem)
		if match {
			result = append(result, elem)
		}
		return match, elem
	})
	return result
}

// Failed handles failed requests
func (this *ProjectService) Failed(elements ifs.IElements, vnic ifs.IVNic, message *ifs.Message) ifs.IElements {
	return nil
}

// TransactionConfig returns the transaction configuration
func (this *ProjectService) TransactionConfig() ifs.ITransactionConfig {
	return nil
}

// WebService returns the web service
func (this *ProjectService) WebService() ifs.IWebService {
	ws := web.New(ServiceName, ServiceArea, &types.Project{},
		&types.Project{}, nil, nil, nil, nil, nil, nil, &types2.Query{}, &types.ProjectList{})
	return ws
}
