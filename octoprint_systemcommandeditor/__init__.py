# coding=utf-8
from __future__ import absolute_import

__author__ = "Marc Hannappel <salandora@gmail.com>"
__license__ = 'GNU Affero General Public License http://www.gnu.org/licenses/agpl.html'

import octoprint.plugin
from octoprint.server import NO_CONTENT
from octoprint.server.util.flask import no_firstrun_access
from octoprint.access.permissions import Permissions

import flask

class SystemCommandEditorPlugin(octoprint.plugin.TemplatePlugin,
								octoprint.plugin.BlueprintPlugin,
                                octoprint.plugin.SettingsPlugin,
								octoprint.plugin.AssetPlugin):
	def get_template_configs(self):
		if "editorcollection" in self._plugin_manager.enabled_plugins:
			return [
				dict(type="plugin_editorcollection_EditorCollection", template="systemcommandeditor_hookedsettings.jinja2", custom_bindings=True)
			]
		else:
			return [
				dict(type="settings", template="systemcommandeditor_hookedsettings.jinja2", custom_bindings=True)
			]

	def get_assets(self):
		return dict(
			js=["js/jquery.ui.sortable.js",
				"js/systemcommandeditor.js",
			    "js/history.js"],
			clientjs=["clientjs/systemcommandeditor.js"],
			css=["css/systemcommandeditor.css"],
			less=["less/systemcommandeditor.less"]
		)

	@octoprint.plugin.BlueprintPlugin.route("/updateSystemCommands", methods=["POST"])
	@no_firstrun_access
	@Permissions.SETTINGS.require(403)
	def update_systemcommands(self):
		data = flask.request.json
		updates = data.get("updates", [])

		commands = self._settings.global_get(["system", "actions"])
		for action in updates:
			success, response = self._process_action(commands, action)
			# In case something is wrong return a message and end to prevent corrupting data
			if not success:
				return response

		self._settings.global_set(["system", "actions"], commands)

		return NO_CONTENT

	def _process_action(self, list, action):
		if action['action'] == "add":
			list.insert(action['data']['index'], action['data']['element'])
		elif action['action'] == "remove":
			list.pop(action['data']['index'])
		elif action['action'] == "edit":
			newData = action['data']
			element = list[newData['index']]

			def _update(key):
				if key in newData:
					element[key] = newData[key]

			def _unique(key):
				value = newData[key]
				return not any(value == obj[key] for obj in list)

			if not _unique('action'):
				return False, flask.make_response(("'action' must be unique!", 400))

			_update("action")

			_update("name")
			_update("command")

			if "confirm" in newData:
				if newData["confirm"] is None:
					del element["confirm"]
				else:
					element["confirm"] = newData["confirm"]
		elif action['action'] == "move":
			oldIndex = action['data']['oldIndex']
			element = list[oldIndex]

			del list[oldIndex]
			list.insert(action['data']['newIndex'], element)

		return True, NO_CONTENT

	def get_update_information(self):
		return dict(
			systemcommandeditor=dict(
				displayName="System Command Editor Plugin",
				displayVersion=self._plugin_version,

				# version check: github repository
				type="github_release",
				user="Salandora",
				repo="OctoPrint-SystemCommandEditor",
				current=self._plugin_version,

				# update method: pip
				pip="https://github.com/Salandora/OctoPrint-SystemCommandEditor/archive/{target_version}.zip"
			)
		)


__plugin_name__ = "System Command Editor"
__plugin_pythoncompat__ = ">=2.7,<4"


def __plugin_load__():
	global __plugin_implementation__
	__plugin_implementation__ = SystemCommandEditorPlugin()

	global __plugin_hooks__
	__plugin_hooks__ = {
		"octoprint.plugin.softwareupdate.check_config": __plugin_implementation__.get_update_information
	}

	global __plugin_license__
	__plugin_license__ = "AGPLv3"
