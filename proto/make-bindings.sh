#!/usr/bin/env bash
# Validate number of arguments (1-10)
if [ $# -lt 1 ] || [ $# -gt 10 ]; then
    echo "Usage: $0 <proto_file1> [proto_file2] ... [proto_file10]"
    echo "Error: Please provide between 1 and 10 proto file arguments"
    exit 1
fi

# Use the protoc image to run protoc.sh and generate the bindings.
for proto_file in "$@"; do
    docker run --user "$(id -u):$(id -g)" -e PROTO="$proto_file" --mount type=bind,source="$PWD",target=/home/proto/ -it saichler/protoc:latest
done

# Now move the generated bindings to the models directory and clean up
mkdir -p ../go/types
mv ./types/*.pb.go ../go/types/.
rm -rf ./types
