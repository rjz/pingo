TARGET=pingo

all: clean build run

build:
	go build -o $(TARGET)

run: $(TARGET)
	./$(TARGET)

clean:
	rm -f $(TARGET)


