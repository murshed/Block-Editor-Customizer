<?php
/**
 * Plugin Name:       Block Editor Customizer
 * Plugin URI:        https://fahimm.com/plugins/block-editor-customizer
 * Description:       Customizer for the WordPress Block Editor. Pin sidebars, toggle sidebar position (Left/Right), and Expand/Collapse All items in Document Overview.
 * Version:           1.0.0
 * Requires at least: 6.0
 * Requires PHP:      7.4
 * Author:            FahimMurshed
 * Author URI:        https://fahimm.com
 * License:           GPL-2.0-or-later
 * License URI:       https://www.gnu.org/licenses/gpl-2.0.html
 * Text Domain:       block-editor-customizer
 * Domain Path:       /languages
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit; // Exit if accessed directly.
}

// Define Plugin Constants
define( 'BLOCK_EDITOR_CUSTOMIZER_VERSION', '1.0.0' );
define( 'BLOCK_EDITOR_CUSTOMIZER_FILE', __FILE__ );
define( 'BLOCK_EDITOR_CUSTOMIZER_PATH', plugin_dir_path( __FILE__ ) );
define( 'BLOCK_EDITOR_CUSTOMIZER_URL', plugin_dir_url( __FILE__ ) );

/**
 * Main Plugin Class
 */
final class Block_Editor_Customizer {

	/**
	 * Single instance of the class.
	 *
	 * @var Block_Editor_Customizer|null
	 */
	private static $instance = null;

	/**
	 * Main Instance.
	 *
	 * @return Block_Editor_Customizer
	 */
	public static function get_instance() {
		if ( is_null( self::$instance ) ) {
			self::$instance = new self();
		}
		return self::$instance;
	}

	/**
	 * Constructor.
	 */
	private function __construct() {
		add_action( 'init', array( $this, 'load_textdomain' ) );
		add_action( 'enqueue_block_editor_assets', array( $this, 'enqueue_editor_assets' ) );
	}

	/**
	 * Load Plugin Text Domain for Internationalization.
	 */
	public function load_textdomain() {
		load_plugin_textdomain(
			'block-editor-customizer',
			false,
			dirname( plugin_basename( __FILE__ ) ) . '/languages'
		);
	}

	/**
	 * Enqueue Block Editor Assets.
	 */
	public function enqueue_editor_assets() {
		wp_enqueue_style(
			'block-editor-customizer-css',
			BLOCK_EDITOR_CUSTOMIZER_URL . 'assets/css/block-editor-customizer.css',
			array( 'wp-components' ),
			BLOCK_EDITOR_CUSTOMIZER_VERSION
		);

		wp_enqueue_script(
			'block-editor-customizer-js',
			BLOCK_EDITOR_CUSTOMIZER_URL . 'assets/js/block-editor-customizer.js',
			array( 'wp-element', 'wp-components', 'wp-data', 'wp-dom-ready' ),
			BLOCK_EDITOR_CUSTOMIZER_VERSION,
			true
		);
	}
}

// Initialize Plugin
Block_Editor_Customizer::get_instance();
