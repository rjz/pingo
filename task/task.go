package task

import (
	"encoding/json"
	"time"
)

// A Runner describes an action
type Runner interface {
	Run() error
}

// Tasks wraps Runners with scheduling information
type Task struct {
	Name          string    `json:"name"`
	ScheduledTime time.Time `json:"scheduledTime"`
	Runner        *Runner   `json:"data"`
	MaxFailures   int       `json:"maxFailures"`
	failures      int
	Repeat        time.Duration `json:"repeat"`
}

// A task is rescheduled based on the number of failures
func (t Task) Reschedule() Task {
	// linear backoff
	timeOffset := time.Second * time.Duration(1+10*t.failures)
	rescheduledTask := t
	rescheduledTask.ScheduledTime = rescheduledTask.ScheduledTime.Add(timeOffset)
	return rescheduledTask
}

func (t Task) MarshalJSON() ([]byte, error) {
	ma := make(map[string]interface{})
	ma["name"] = t.Name
	ma["time"] = t.ScheduledTime
	ma["data"] = t.Runner
	ma["maxFailures"] = t.MaxFailures
	ma["repeat"] = t.Repeat
	switch {
	case t.failures > 0:
		ma["status"] = "STATUS_FAILING"
	default:
		ma["status"] = "STATUS_OK"
	}
	return json.Marshal(ma)
}
