package task

import (
	"net/http"
)

type PingTask struct {
	Url string `json:"url"`
}

func (t PingTask) Run() error {
	resp, err := http.Get(t.Url)
	if err != nil {
		return TaskError(err.Error())
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return TaskError(err.Error())
	}
	return nil
}
