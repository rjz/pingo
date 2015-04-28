package task

import (
	"fmt"
)

type action uint8

const (
	actionAdd action = iota
	actionRemove
	actionRun
	actionReschedule
	actionFail
)

var actionNames = [...]string{
	actionAdd:        "actionAdd",
	actionRemove:     "actionRemove",
	actionRun:        "actionRun",
	actionReschedule: "actionReschedule",
	actionFail:       "actionFail",
}

type TaskAction struct {
	Action action
	Task   Task
}

func (a action) String() string {
	if int(a) < len(actionNames) {
		return actionNames[a]
	}

	return fmt.Sprintf("unknown action %d", int(a))
}
