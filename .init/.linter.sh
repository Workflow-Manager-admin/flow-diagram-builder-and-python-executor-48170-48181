#!/bin/bash
cd /home/kavia/workspace/code-generation/flow-diagram-builder-and-python-executor-48170-48181/react_frontend
npm run build
EXIT_CODE=$?
if [ $EXIT_CODE -ne 0 ]; then
   exit 1
fi

