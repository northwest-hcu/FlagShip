ARG NODE_MAJOR=24
FROM node:${NODE_MAJOR}-alpine

ENV NODE_ENV=development \
    NPM_CONFIG_MIN_RELEASE_AGE=7

WORKDIR /workspace

# node_modules用のDocker Volumeを非root Userで利用できるようにする
RUN mkdir -p /workspace/node_modules \
    && chown -R node:node /workspace

USER node

EXPOSE 5173

# DependencyをDocker VolumeへInstallしてからVite Development Serverを起動する
CMD ["sh", "-lc", "npm install && exec npm run dev -- --host 0.0.0.0 --strictPort"]