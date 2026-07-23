/**
 * Block Editor Customizer
 * Modular extension for WordPress Block Editor
 * Features: Sidebar Pinning, Position Toggle (Left/Right), Expand & Collapse All for Document Overview by Fahim Murshed
 */
(function () {
	if (!window.wp || !wp.domReady) return;

	var BlockEditorCustomizer = {
		// Module 1: Sidebar Position (Left / Right)
		PositionModule: {
			key: 'bec_sidebar_position',
			getPosition: function () {
				return localStorage.getItem(this.key) || 'left';
			},
			setPosition: function (pos) {
				localStorage.setItem(this.key, pos);
				this.apply();
			},
			toggle: function () {
				var next = this.getPosition() === 'left' ? 'right' : 'left';
				this.setPosition(next);
				return next;
			},
			apply: function () {
				var isRight = this.getPosition() === 'right';
				if (isRight) {
					document.body.classList.add('bec-position-right');
				} else {
					document.body.classList.remove('bec-position-right');
				}
			},
			init: function () {
				this.apply();
			}
		},

		// Module 2: Sidebar Pinning
		PinModule: {
			getStorageKey: function (isInserter) {
				return isInserter ? 'bec_inserter_pinned' : 'bec_list_view_pinned';
			},
			isPinned: function (isInserter) {
				return localStorage.getItem(this.getStorageKey(isInserter)) === 'true';
			},
			togglePin: function (isInserter) {
				var key = this.getStorageKey(isInserter);
				var next = !(localStorage.getItem(key) === 'true');
				localStorage.setItem(key, String(next));
				return next;
			},
			autoOpenIfPinned: function () {
				setTimeout(function () {
					if (!wp.data || !wp.data.dispatch('core/editor')) return;
					var inserterPinned = localStorage.getItem('bec_inserter_pinned') === 'true';
					var listViewPinned = localStorage.getItem('bec_list_view_pinned') === 'true';

					if (inserterPinned) {
						wp.data.dispatch('core/editor').setIsInserterOpened(true);
					} else if (listViewPinned) {
						wp.data.dispatch('core/editor').setIsListViewOpened(true);
					}
				}, 350);
			}
		},

		// Module 3: Document Overview Expand & Collapse All
		ExpandCollapseModule: {
			// Query block hierarchy via WP Data store to find all parent blocks with innerBlocks
			getAllParentClientIds: function () {
				if (!wp.data || !wp.data.select('core/block-editor')) return [];
				var blocks = wp.data.select('core/block-editor').getBlocks();
				var parentClientIds = [];

				function traverse(blockList) {
					if (!blockList || !blockList.length) return;
					blockList.forEach(function (b) {
						if (b.innerBlocks && b.innerBlocks.length > 0) {
							parentClientIds.push(b.clientId);
							traverse(b.innerBlocks);
						}
					});
				}

				traverse(blocks);
				return parentClientIds;
			},

			triggerToggle: function (el) {
				if (!el) return;

				// Target ONLY span.block-editor-list-view__expander, NEVER parent <a> elements!
				var expander = (el.classList && el.classList.contains('block-editor-list-view__expander'))
					? el
					: el.querySelector('.block-editor-list-view__expander, [data-testid="list-view-expander"]');

				if (!expander) return;

				// 1. Direct React Fiber props invocation
				var propsKey = Object.keys(expander).find(function (k) {
					return k.startsWith('__reactProps$') || k.startsWith('__reactEventHandlers$');
				});

				if (propsKey && expander[propsKey] && typeof expander[propsKey].onClick === 'function') {
					try {
						var fakeEvt = {
							preventDefault: function () { },
							stopPropagation: function () { },
							target: expander,
							currentTarget: expander
						};
						expander[propsKey].onClick(fakeEvt, { forceToggle: true });
						return; // Handled safely by React component!
					} catch (err) { }
				}

				// 2. Dispatch MouseEvent on span.block-editor-list-view__expander ONLY
				try {
					var clickEvt = new MouseEvent('click', { bubbles: true, cancelable: true, view: window });
					expander.dispatchEvent(clickEvt);
				} catch (err) { }
			},

			isAnyExpanded: function () {
				var expandedRows = document.querySelectorAll(
					'a.block-editor-list-view-block-select-button[aria-expanded="true"], [data-expanded="true"]'
				);
				return expandedRows.length > 0;
			},

			expandAll: function () {
				var self = this;
				var clientIds = self.getAllParentClientIds();
				var pass = 0;
				var maxPasses = 5;

				function step() {
					var foundAny = false;

					// Pass A: Expand by matched parent block clientIds
					clientIds.forEach(function (id) {
						var row = document.querySelector('[data-block="' + id + '"], [href="#block-' + id + '"]');
						if (!row) return;

						var selectBtn = row.classList && row.classList.contains('block-editor-list-view-block-select-button')
							? row
							: row.querySelector('a.block-editor-list-view-block-select-button, [aria-expanded]');

						if (selectBtn && selectBtn.getAttribute('aria-expanded') === 'false') {
							foundAny = true;
							self.triggerToggle(selectBtn);
						}
					});

					// Pass B: Generic DOM scan for any collapsed expanders
					var genericCollapsed = document.querySelectorAll(
						'a.block-editor-list-view-block-select-button[aria-expanded="false"], [aria-expanded="false"]'
					);
					genericCollapsed.forEach(function (el) {
						foundAny = true;
						self.triggerToggle(el);
					});

					pass++;
					if (foundAny && pass < maxPasses) {
						setTimeout(step, 75);
					}
				}

				step();
			},

			collapseAll: function () {
				var self = this;
				var expandedElements = document.querySelectorAll(
					'a.block-editor-list-view-block-select-button[aria-expanded="true"], [data-expanded="true"]'
				);

				expandedElements.forEach(function (el) {
					self.triggerToggle(el);
				});
			},

			toggle: function () {
				if (this.isAnyExpanded()) {
					this.collapseAll();
					return false; // Now collapsing/collapsed
				} else {
					this.expandAll();
					return true; // Now expanding/expanded
				}
			}
		},

		// SVG Icons helper
		Icons: {
			pinOutline: 'm21.5 9.1-6.6-6.6-4.2 5.6c-1.2-.1-2.4.1-3.6.7-.1 0-.1.1-.2.1-.5.3-.9.6-1.2.9l3.7 3.7-5.7 5.7v1.1h1.1l5.7-5.7 3.7 3.7c.4-.4.7-.8.9-1.2.1-.1.1-.2.2-.3.6-1.1.8-2.4.6-3.6l5.6-4.1zm-7.3 3.5.1.9c.1.9 0 1.8-.4 2.6l-6-6c.8-.4 1.7-.5 2.6-.4l.9.1L15 4.9 19.1 9l-4.9 3.6z',
			pinFilled: 'M16 12V4h1V2H7v2h1v8l-2 2v2h5.2v6h1.6v-6H18v-2l-2-2z',
			flipPosition: 'M18 4H6c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm-4 14.5H6c-.3 0-.5-.2-.5-.5V6c0-.3.2-.5.5-.5h8v13zm4.5-.5c0 .3-.2.5-.5.5h-2.5v-13H18c.3 0 .5.2.5.5v12z',
			expandAll: 'M16.59 8.59L12 13.17 7.41 8.59 6 10l6 6 6-6zM16.59 4.59L12 9.17 7.41 4.59 6 6l6 6 6-6z',
			collapseAll: 'M12 8l-6 6h12l-6-6zm0 8l-6 6h12l-6-6z',
			getSvg: function (path) {
				return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="20" height="20"><path d="' + path + '"></path></svg>';
			}
		},

		// UI Controls Inserter
		injectControls: function () {
			var self = this;

			// Observe header containers for Position button, Expand/Collapse button, and Pin button
			var containers = document.querySelectorAll('.block-editor-tabbed-sidebar__tablist-and-close-button');
			containers.forEach(function (container) {
				var closeBtn = container.querySelector('.block-editor-tabbed-sidebar__close-button');
				if (!closeBtn) return;

				var closeLabel = closeBtn.getAttribute('aria-label') || closeBtn.getAttribute('title') || '';
				var isInserter = closeLabel.indexOf('Inserter') !== -1 || !!container.querySelector('[id*="blocks"]');

				// 1. Inject Position Toggle Button
				if (!container.querySelector('.bec-position-button')) {
					var posBtn = document.createElement('button');
					posBtn.type = 'button';
					posBtn.className = 'components-button has-icon bec-position-button';
					var isRight = self.PositionModule.getPosition() === 'right';
					var posTitle = 'Switch Sidebar Position (Current: ' + (isRight ? 'Right' : 'Left') + ')';
					posBtn.setAttribute('aria-label', posTitle);
					posBtn.setAttribute('title', posTitle);
					posBtn.innerHTML = self.Icons.getSvg(self.Icons.flipPosition);

					if (isRight) posBtn.classList.add('is-pressed');

					posBtn.addEventListener('click', function (e) {
						e.preventDefault();
						e.stopPropagation();
						var newPos = self.PositionModule.toggle();
						var newTitle = 'Switch Sidebar Position (Current: ' + (newPos === 'right' ? 'Right' : 'Left') + ')';
						posBtn.setAttribute('aria-label', newTitle);
						posBtn.setAttribute('title', newTitle);
						if (newPos === 'right') {
							posBtn.classList.add('is-pressed');
						} else {
							posBtn.classList.remove('is-pressed');
						}
					});

					container.insertBefore(posBtn, closeBtn);
				}

				// 2. Inject Single Expand / Collapse Button (Only for Document Overview)
				if (!isInserter && !container.querySelector('.bec-expand-collapse-button')) {
					var expBtn = document.createElement('button');
					expBtn.type = 'button';
					expBtn.className = 'components-button has-icon bec-expand-collapse-button';

					var isCurrentlyExpanded = self.ExpandCollapseModule.isAnyExpanded();
					var expTitle = isCurrentlyExpanded ? 'Collapse All Items' : 'Expand All Items';
					expBtn.setAttribute('aria-label', expTitle);
					expBtn.setAttribute('title', expTitle);
					expBtn.innerHTML = self.Icons.getSvg(isCurrentlyExpanded ? self.Icons.collapseAll : self.Icons.expandAll);

					expBtn.addEventListener('click', function (e) {
						e.preventDefault();
						e.stopPropagation();
						var isExpandedNow = self.ExpandCollapseModule.toggle();
						var newTitle = isExpandedNow ? 'Collapse All Items' : 'Expand All Items';
						expBtn.setAttribute('aria-label', newTitle);
						expBtn.setAttribute('title', newTitle);
						expBtn.innerHTML = self.Icons.getSvg(isExpandedNow ? self.Icons.collapseAll : self.Icons.expandAll);
					});

					container.insertBefore(expBtn, closeBtn);
				}

				// 3. Inject Pin Button BEFORE Close Button
				if (!container.querySelector('.bec-pin-button')) {
					var isPinned = self.PinModule.isPinned(isInserter);
					var pinBtn = document.createElement('button');
					pinBtn.type = 'button';
					pinBtn.className = 'components-button has-icon bec-pin-button' + (isPinned ? ' is-pressed' : '');

					var pinTitle = isPinned
						? (isInserter ? 'Unpin Block Inserter' : 'Unpin Document Overview')
						: (isInserter ? 'Pin Block Inserter' : 'Pin Document Overview');

					pinBtn.setAttribute('aria-label', pinTitle);
					pinBtn.setAttribute('title', pinTitle);
					pinBtn.setAttribute('aria-pressed', isPinned ? 'true' : 'false');
					pinBtn.innerHTML = self.Icons.getSvg(isPinned ? self.Icons.pinFilled : self.Icons.pinOutline);

					pinBtn.addEventListener('click', function (e) {
						e.preventDefault();
						e.stopPropagation();
						var nextState = self.PinModule.togglePin(isInserter);
						var newTitle = nextState
							? (isInserter ? 'Unpin Block Inserter' : 'Unpin Document Overview')
							: (isInserter ? 'Pin Block Inserter' : 'Pin Document Overview');

						pinBtn.setAttribute('aria-label', newTitle);
						pinBtn.setAttribute('title', newTitle);
						pinBtn.setAttribute('aria-pressed', nextState ? 'true' : 'false');

						if (nextState) {
							pinBtn.classList.add('is-pressed');
						} else {
							pinBtn.classList.remove('is-pressed');
						}

						pinBtn.innerHTML = self.Icons.getSvg(nextState ? self.Icons.pinFilled : self.Icons.pinOutline);
					});

					// Insert BEFORE Close Button
					container.insertBefore(pinBtn, closeBtn);
				}
			});
		},

		// Initialize Customizer
		init: function () {
			var self = this;
			self.PositionModule.init();
			self.PinModule.autoOpenIfPinned();

			// Continuous DOM observer for dynamically rendered sidebar elements
			var observer = new MutationObserver(function () {
				self.injectControls();
			});

			observer.observe(document.body, { childList: true, subtree: true });
		}
	};

	wp.domReady(function () {
		BlockEditorCustomizer.init();
	});
})();
