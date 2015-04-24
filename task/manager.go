package task

import (
	"fmt"
	"log"
	"os"
	"sync"
	"time"
)

type TaskList []Task

func (tasks *TaskList) Find(name string) *Task {
	for _, task := range *tasks {
		if task.Name == name {
			return &task
		}
	}
	return nil
}

func newTaskList() TaskList {
	return make(TaskList, 0)
}

type Manager struct {
	FailedTasks TaskList
	Tasks       TaskList
	*log.Logger
	*time.Ticker
	*sync.Mutex
}

func NewManager() *Manager {
	manager := Manager{
		Logger:      log.New(os.Stdout, fmt.Sprintf("[task] "), log.Flags()),
		Mutex:       &sync.Mutex{},
		Tasks:       newTaskList(),
		Ticker:      time.NewTicker(time.Second),
		FailedTasks: newTaskList(),
	}

	go func() {
		for _ = range manager.Ticker.C {
			manager.runAll()
		}
	}()

	return &manager
}

func (manager *Manager) groomedTasks() TaskList {
	pendingTasks := newTaskList()
	activeTasks := newTaskList()
	now := time.Now()

	manager.Lock()
	for _, t := range manager.Tasks {
		if t.ScheduledTime.After(now) {
			pendingTasks = append(pendingTasks, t)
			continue
		}

		activeTasks = append(activeTasks, t)
	}
	manager.Tasks = pendingTasks
	manager.Unlock()

	return activeTasks
}

func (manager *Manager) syncAdd(t Task) (err error) {
	manager.Lock()
	manager.Tasks = append(manager.Tasks, t)
	manager.Unlock()
	return nil
}

func (manager *Manager) fail(t Task) {
	manager.Logger.Println(t.Name, t.failures, TaskError("failed after retries."))
	manager.FailedTasks = append(manager.FailedTasks, t)
}

func (manager *Manager) runOne(t Task) {
	if err := (*t.Runner).Run(); err != nil {
		t.failures += 1
		manager.Logger.Println(t.Name, t.failures, err)

		if t.failures >= t.MaxFailures {
			manager.fail(t)
			return
		}

		manager.syncAdd(t.Reschedule())
		return
	}

	t.failures = 0
	manager.syncAdd(t.Reschedule())
}

// Run all tasks set to run before current time
func (manager *Manager) runAll() {
	ts := manager.groomedTasks()
	for _, task := range ts {
		task := task
		go func() {
			manager.runOne(task)
			return
		}()
	}
}

func (manager *Manager) Add(t Task) error {
	manager.Lock()
	if manager.Tasks.Find(t.Name) != nil {
		manager.Unlock()
		return TaskError("Task already exists!")
	}
	manager.Logger.Println(t.Name, "added for", t.ScheduledTime)
	manager.Tasks = append(manager.Tasks, t)
	manager.Unlock()
	return nil
}
