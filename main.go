package main

import (
	"github.com/julienschmidt/httprouter"
	"github.com/rjz/pingo/app"
	"github.com/rjz/pingo/routes"
	"log"
	"net/http"
	"os"
)

const (
	// TODO: allow env/configured port
	port = ":30080"
)

type Route func(http.ResponseWriter, *http.Request, httprouter.Params) error

var logger = log.New(os.Stdout, "[app] ", log.Flags())

func NotFoundHandler(w http.ResponseWriter, r *http.Request) {
	errorHandler(w, r, app.Error{Status: http.StatusNotFound, Message: "Not found :-("})
}

func cors(domain string) func(http.ResponseWriter, *http.Request) {
	return func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Access-Control-Allow-Origin", domain)
	}
}

func errorHandler(w http.ResponseWriter, r *http.Request, err error) {
	switch typedErr := err.(type) {

	case app.Error:
		logger.Printf("%d - %s %s", err.(app.Error).Status, r.Method, r.URL)
		app.WriteError(w, typedErr)

	default:
		errorHandler(w, r, app.Error{Status: http.StatusInternalServerError, Message: err.Error()})
	}
}

func Handler(fn Route) httprouter.Handle {

	cors := cors("http://localhost:8000")

	return func(w http.ResponseWriter, r *http.Request, p httprouter.Params) {
		cors(w, r)

		if err := fn(w, r, p); err != nil {
			errorHandler(w, r, err)
		}
	}
}

func init() {

	logger.Printf("Started server at http://localhost%v.\n", port)

	router := httprouter.Router{
		NotFound:              NotFoundHandler,
		RedirectTrailingSlash: true,
		RedirectFixedPath:     true,
	}

	router.GET("/tasks", Handler(routes.ListTasks))
	router.POST("/tasks", Handler(routes.CreateTask))
	router.GET("/tasks/:id", Handler(routes.ShowTask))

	log.Fatal(http.ListenAndServe(port, &router))
}

func main() {}
