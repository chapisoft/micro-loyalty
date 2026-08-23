1. Install right yarn version by using corepack: `corepack enable`
2. Install dependencies for all package in monorepo: `yarn install`

3. For react apps, components library is imported directly in-app, so no need to build the library separately.

4. Run the apps, cd to that app directory, react in `apps/`:

For react: `yarn dev`

```
cd app
yarn dev
```

5. Build apps, in specific app directory, run: `yarn build`
6. Deploy apps, upload files in `dist/`
