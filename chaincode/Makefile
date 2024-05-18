all: main.go utils.go policy.go rtbf.go private.go access.go protected.go committee.go action.go
	go mod tidy
	go mod vendor
	go build main.go utils.go policy.go rtbf.go private.go access.go protected.go committee.go action.go

clean:
	-rm main
	rm -rf vendor
