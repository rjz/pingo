package task

import (
	"fmt"
)

type TaskError string

func (err TaskError) Error() string {
	return fmt.Sprintf("err: '%s'", string(err))
}
