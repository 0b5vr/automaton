# CONTRIBUTING.md

It's just a memorandum for myself

### Release

- 1, Make sure you're on `dev`

- 2, Run:

  ```sh
  yarn lerna version <newversion> --exact --no-push # will also inspects and builds
  yarn lerna publish from-git --dist-tag latest

  git switch release
  git merge dev
  git push
  ```

- 3, Add a release note to https://github.com/0b5vr/automaton/releases
