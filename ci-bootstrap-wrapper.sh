#!/usr/bin/env bash
set -euo pipefail
GRADLE_VERSION=8.7
curl -sL https://services.gradle.org/distributions/gradle-${GRADLE_VERSION}-bin.zip -o /tmp/gradle.zip
unzip -q /tmp/gradle.zip -d /tmp/gradle
/tmp/gradle/gradle-${GRADLE_VERSION}/bin/gradle -p . wrapper --gradle-version ${GRADLE_VERSION}
