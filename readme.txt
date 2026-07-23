=== Block Editor Customizer ===
Contributors: FahimMurshed
Donate link: https://fahimm.com
Tags: block editor, gutenberg, sidebar, inserter, document overview
Requires at least: 6.0
Tested up to: 6.7
Stable tag: 1.0.0
Requires PHP: 7.4
License: GPLv2 or later
License URI: https://www.gnu.org/licenses/gpl-2.0.html

Customizer for the WordPress Block Editor. Pin sidebars, toggle sidebar position (Left/Right), and Expand/Collapse All in Document Overview.

== Description ==

Block Editor Customizer enhances your WordPress editing experience by providing productivity controls for the Block Editor (Gutenberg):

* **Sidebar Pinning**: Add a Pin button before the Close button on both Block Inserter and Document Overview sidebars so they stay pinned open.
* **Sidebar Position Toggle**: Effortlessly switch the Block Inserter & Document Overview sidebar layout position between Left and Right.
* **Expand & Collapse All**: Easily expand or collapse all nested blocks in Document Overview with a single click (`.block-editor-list-view__expander`).
* **Persistent Settings**: All customizations automatically persist using `localStorage`.

== Installation ==

1. Upload the `block-editor-customizer` folder to the `/wp-content/plugins/` directory.
2. Activate the plugin through the 'Plugins' menu in WordPress.
3. Open the Block Editor on any Post or Page to enjoy the new controls.

== Frequently Asked Questions ==

= Does this plugin modify core WordPress files? =
No. Block Editor Customizer operates 100% independently through clean JavaScript hooks and CSS layout overrides without touching WordPress core files.

= How do I expand or collapse all blocks in Document Overview? =
Open the Document Overview sidebar in the editor and click the new Expand/Collapse All button in the header bar.

== Changelog ==

= 1.0.0 =
* Initial release with Sidebar Pinning, Left/Right Position Toggle, and Document Overview Expand/Collapse All.
