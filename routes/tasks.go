package routes

import (
	"github.com/julienschmidt/httprouter"
	"github.com/rjz/pingo/app"
	"github.com/rjz/pingo/task"
	"net/http"
	"time"
)

type TaskData map[string]interface{}

type TaskRequest struct {
	Name string   `json:"name"`
	Type string   `json:"type"`
	Data TaskData `json:"data"`
}

// Global taskManager
// TODO: persist this somewhere...
var taskManager = task.NewManager()

func validateTask(t TaskRequest) app.ValidationResult {
	errors := app.NewValidator()

	if t.Name == "" {
		errors.Required("name")
	}

	// Require unique names
	if taskManager.Tasks.Find(t.Name) != nil {
		errors.Invalid("name", t.Name)
	}

	if t.Type == "" {
		errors.Required("type")
	}

	switch t.Type {
	case "ping":
		if t.Data == nil || t.Data["url"] == nil {
			errors.Required("data.url")
		}
	default:
		errors.Invalid("type", t.Type)
	}

	return errors

}

// POST /tasks
func CreateTask(w http.ResponseWriter, r *http.Request, _ httprouter.Params) error {

	var rt TaskRequest
	var runner task.Runner

	if err := app.ParseJson(r, &rt); err != nil {
		return err
	}

	if err := validateTask(rt).Exec(); err != nil {
		return err
	}

	switch rt.Type {
	case "ping":
		runner = task.PingTask{Url: rt.Data["url"].(string)}
	}

	scheduledTime := time.Now().Add(3 * time.Second)

	t := task.Task{
		Name:          rt.Name,
		ScheduledTime: scheduledTime,
		Runner:        &runner,
		MaxFailures:   3,
		Repeat:        time.Second,
	}

	if err := taskManager.Add(t); err != nil {
		return app.HttpError(http.StatusInternalServerError)
	}

	app.WriteJson(w, t)

	return nil
}

// GET /tasks
func ListTasks(w http.ResponseWriter, r *http.Request, _ httprouter.Params) error {
	response := make(map[string]interface{})
	response["tasks"] = taskManager.Tasks
	response["failed"] = taskManager.FailedTasks
	app.WriteJson(w, response)
	return nil
}

// GET /tasks/:id
func ShowTask(w http.ResponseWriter, r *http.Request, p httprouter.Params) error {
	task := taskManager.Tasks.Find(p.ByName("id"))
	if task == nil {
		return app.HttpError(http.StatusNotFound)
	}
	app.WriteJson(w, task)
	return nil
}
