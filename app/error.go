package app

import (
	"fmt"
	"net/http"
)

type Error struct {
	Status  int         `json:"status"`
	Message string      `json:"message",omitempty`
	Data    interface{} `json:"data",omitempty`
}

func (e Error) Error() string {
	var message = e.Message
	if message == "" {
		message = http.StatusText(e.Status)
	}
	return fmt.Sprintf("%i %q", e.Status, message)
}

func HttpError(status int) Error {
	return Error{Status: status, Message: http.StatusText(status)}
}

func WriteError(w http.ResponseWriter, err Error) {
	w.WriteHeader(err.Status)
	WriteJson(w, err)
}
