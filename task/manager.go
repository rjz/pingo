package task

import (
	"fmt"
	"log"
	"os"
	"sync"
	"time"
)

type Manager struct {
	tasks []Task
	*sync.Mutex
	*log.Logger
	*time.Ticker
}

func New() *Manager {
	logger := log.New(os.Stdout, fmt.Sprintf("[task] "), log.Flags())
	manager := Manager{Logger: logger, Mutex: new(sync.Mutex)}
	manager.Ticker = time.NewTicker(time.Second)

	go func() {
		for _ = range manager.Ticker.C {
			manager.runAll()
		}
	}()

	return &manager
}

func (manager *Manager) groomedTasks() []Task {
	pendingTasks := make([]Task, 0)
	activeTasks := make([]Task, 0)
	now := time.Now()

	manager.Lock()
	for _, t := range manager.tasks {
		if t.ScheduledTime.After(now) {
			pendingTasks = append(pendingTasks, t)
			continue
		}

		activeTasks = append(activeTasks, t)
	}
	manager.tasks = pendingTasks
	manager.Unlock()

	return activeTasks
}

func (manager *Manager) syncAdd(t Task) (err error) {
	manager.Lock()
	manager.tasks = append(manager.tasks, t)
	manager.Unlock()
	return nil
}

func (manager *Manager) fail(t Task) {
	manager.Logger.Println(t.Name, t.failures, TaskError("failed after retries."))
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
	manager.Logger.Println(t.Name, "added for", t.ScheduledTime)
	manager.syncAdd(t)
	return nil
}

func (manager *Manager) Remove(name string) (err error) {
	tp := manager.Find(name)
	if tp == nil {
		return TaskError("Doesn't exist.")
	}

	return nil
}

func (manager *Manager) Find(name string) (tp *Task) {
	for _, task := range manager.tasks {
		if task.Name == name {
			return &task
		}
	}
	return
}

func (manager *Manager) Tasks() []Task {
	return manager.tasks
}
