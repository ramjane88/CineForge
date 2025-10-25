@ECHO OFF
set DEFAULT_JVM_OPTS="-Xmx64m" "-Xms64m"
set CLASSPATH=%~dp0\gradle\wrapper\gradle-wrapper.jar
if not "%JAVA_HOME%"=="" (
  set JAVACMD="%JAVA_HOME%\bin\java.exe"
) else (
  set JAVACMD=java
)
%JAVACMD% %DEFAULT_JVM_OPTS% -cp %CLASSPATH% org.gradle.wrapper.GradleWrapperMain %*
