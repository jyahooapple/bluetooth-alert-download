# Bluetooth Alert — public beta testing

[Download and beginner tester guide](https://jyahooapple.github.io/bluetooth-alert-download/)

The page explains what the app is and its privacy model, how to install the latest beta, a basic generated-alert test while stationary, the beta.6 recovery tests from bluetooth-alert-poc issue #79, including in a car (power loss, quick power flaps, out of range, force-stop, overnight "Welcome back"), setup troubleshooting, and how to report results. Its local report builder opens an email draft with no recipient filled in; testers add the address from their invitation. Nothing is uploaded automatically.

Testers email the report together with the app's own privacy-safe exports (capability report, `safe-v2_` field-test package, and debug log text if asked). The app builds these from an allowlist of technical facts and leaves out message content, names, numbers, device names and addresses, so testers only check what they write themselves. Screenshots, photos and ZIP files from older app versions are not cleaned and should not be sent.

[Open a beta report on GitHub](https://github.com/jyahooapple/bluetooth-alert-download/issues/new?template=beta-test.md) is still available for testers with an account. Issues are public, so no app files go there.
