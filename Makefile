DIR := ${CURDIR}
SRC=src
DIST=dist
BIN=./node_modules/.bin
DESKTOP_DIR=$(shell cd ../desktop; pwd)

.PHONY: build start install

create-node-modules:
	mkdir -p "${DIR}/node_modules"

link-modules: create-node-modules unlink-modules
	ln -sf "${DESKTOP_DIR}/src/core" "${DIR}/node_modules/notion-core"
	ln -sf "${DESKTOP_DIR}/src/modules" "${DIR}/node_modules/notion-modules"
	ln -sf "${DESKTOP_DIR}/src/app" "${DIR}/node_modules/notion-app"

unlink-modules:
	rm -f "${DIR}/node_modules/notion-core"
	rm -f "${DIR}/node_modules/notion-modules"
	rm -f "${DIR}/node_modules/notion-app"

install: link-modules
	yarn

build:
	${BIN}/browserify --ignore-missing --no-builtins --no-commondir --insert-global-vars="global" --no-browser-field \
		-t babelify \
		${SRC}/cli.js -o ${DIST}/cli.js

start:
	node ${DIST}/cli.js
