#!/usr/bin/env sh
JAVA_EXEC="$JAVA_HOME/bin/java"
CLASSPATH="gradle/wrapper/gradle-wrapper.jar"
"$JAVA_EXEC" -classpath "$CLASSPATH" org.gradle.wrapper.GradleWrapperMain "$@"
