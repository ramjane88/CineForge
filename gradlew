#!/usr/bin/env sh
APP_HOME=$(cd "$(dirname "$0")"; pwd)
DEFAULT_JVM_OPTS='-Xmx64m -Xms64m'
if [ -n "$JAVA_HOME" ]; then
  JAVACMD="$JAVA_HOME/bin/java"
else
  JAVACMD="java"
fi
if ! command -v "$JAVACMD" >/dev/null 2>&1; then
  echo "Java not found. Install JDK 17+." >&2
  exit 1
fi
exec "$JAVACMD" $DEFAULT_JVM_OPTS -cp "$APP_HOME/gradle/wrapper/gradle-wrapper.jar" org.gradle.wrapper.GradleWrapperMain "$@"
