package app

import (
	"encoding/json"
	"io/ioutil"
	"net/http"
)

func ParseJson(r *http.Request, dest interface{}) error {
	body, err := ioutil.ReadAll(r.Body)
	if err != nil {
		return Error{Status: http.StatusBadRequest, Message: "Failed reading request?"}
	}

	if err := json.Unmarshal(body, dest); err != nil {
		return Error{Status: http.StatusBadRequest, Message: "Invalid JSON"}
	}

	return nil
}

func WriteJson(w http.ResponseWriter, m interface{}) {
	js, _ := json.Marshal(m)
	w.Header().Set("Content-Type", "application/json")
	w.Write(js)
}
