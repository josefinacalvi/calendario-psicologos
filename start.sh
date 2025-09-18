
#!/bin/bash
PORT=${PORT:-3000}
echo "Starting on port $PORT"
npx next start -H 0.0.0.0 -p $PORT
