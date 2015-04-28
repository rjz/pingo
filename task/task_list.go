package task

type TaskList []Task

func (tasks *TaskList) Find(name string) *Task {
	for _, task := range *tasks {
		if task.Name == name {
			return &task
		}
	}
	return nil
}

func (tasks *TaskList) IndexOf(t Task) int {
	for i, task := range *tasks {
		if task == t {
			return i
		}
	}
	return -1
}
