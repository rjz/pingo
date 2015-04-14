package app

import (
	"net/http"
)

type Validator interface {
	Validate() []string
}

// TODO: use an existing, robust validation library
type ValidationResult map[string]interface{}

func defaultV(m ValidationResult, k string, v interface{}) {
	if _, ok := m[k]; ok == false {
		m[k] = v
	}
}

func NewValidator() ValidationResult {
	return make(ValidationResult)
}

func (v ValidationResult) Required(field string) {
	defaultV(v, field, "Missing required field '"+field+"'")
}

func (v ValidationResult) Invalid(field string, value interface{}) {
	defaultV(v, field, "Invalid value for '"+field+"': '"+value.(string)+"'")
}

func (v ValidationResult) Any() bool {
	return len(v) > 0
}

func (m ValidationResult) ToMessages() []string {
	var messageStrs []string

	for _, v := range m {
		messageStrs = append(messageStrs, v.(string))
	}

	return messageStrs
}

func (v ValidationResult) Exec() error {
	if v.Any() {
		return Error{http.StatusBadRequest, "Invalid Task", v.ToMessages()}
	}

	return nil
}
