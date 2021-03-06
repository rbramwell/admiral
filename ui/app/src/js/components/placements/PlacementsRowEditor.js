/*
 * Copyright (c) 2016 VMware, Inc. All Rights Reserved.
 *
 * This product is licensed to you under the Apache License, Version 2.0 (the "License").
 * You may not use this product except in compliance with the License.
 *
 * This product may include a number of subcomponents with separate copyright notices
 * and license terms. Your use of these subcomponents is subject to the terms and
 * conditions of the subcomponent's license, as noted in the LICENSE file.
 */

import PlacementsRowEditTemplate from 'PlacementsRowEditTemplate';
import {
  PlacementContextToolbarActions, PlacementActions
}
from 'actions/Actions';
import DropdownSearchMenu from 'components/common/DropdownSearchMenu';
import Alert from 'components/common/Alert';
import constants from 'core/constants';
import utils from 'core/utils';

const resourcePoolManageOptions = [{
  id: 'rp-create',
  name: i18n.t('app.resourcePool.createNew'),
  icon: 'plus'
}, {
  id: 'rp-manage',
  name: i18n.t('app.resourcePool.manage'),
  icon: 'pencil'
}];

const GROUPS_MANAGE_OPTIONS = [{
  id: 'group-create',
  name: i18n.t('app.group.createNew'),
  icon: 'plus'
}, {
  id: 'group-manage',
  name: i18n.t('app.group.manage'),
  icon: 'pencil'
}];

const deploymentPolicyManageOptions = [{
  id: 'policy-create',
  name: i18n.t('app.deploymentPolicy.createNew'),
  icon: 'plus'
}, {
  id: 'policy-manage',
  name: i18n.t('app.deploymentPolicy.manage'),
  icon: 'pencil'
}];

function PlacementsRowEditor() {
  this.$el = $(PlacementsRowEditTemplate());

  if (utils.isApplicationEmbedded()) {
    let groupFromEl = this.$el.find('.group');
    let groupFormLabelEl = groupFromEl.find('.control-label');
    groupFormLabelEl.append('<span class="requiredFieldMark">*</span>');
  }

  this.$el.find('.fa-question-circle').tooltip();

  this.alert = new Alert(this.$el, this.$el.find('.placementEdit'), true);

  this.placementGroupInput = new GroupInput(this.$el.find('.placementGroupInput'), () =>
    toggleButtonsState.call(this));

  let resourcePoolInputEl = this.$el.find('.resourcePool .form-control');
  this.resourcePoolInput = new DropdownSearchMenu(resourcePoolInputEl, {
    title: i18n.t('app.placement.edit.selectResourcePool'),
    searchPlaceholder: i18n.t('dropdownSearchMenu.searchPlaceholder', {
      entity: i18n.t('app.resourcePool.entity')
    })
  });

  this.resourcePoolInput.setManageOptions(resourcePoolManageOptions);
  this.resourcePoolInput.setManageOptionSelectCallback(function(option) {
    if (option.id === 'rp-create') {
      PlacementContextToolbarActions.createResourcePool();
    } else {
      PlacementContextToolbarActions.manageResourcePools();
    }
  });
  this.resourcePoolInput.setClearOptionSelectCallback(() => toggleButtonsState.call(this));

  this.resourcePoolInput.setOptionSelectCallback(() => toggleButtonsState.call(this));

  var deploymentPolicyEl = this.$el.find('.deploymentPolicy .form-control');
  this.deploymentPolicyInput = new DropdownSearchMenu(deploymentPolicyEl, {
    title: i18n.t('app.placement.edit.selectDeploymentPolicy'),
    searchPlaceholder: i18n.t('dropdownSearchMenu.searchPlaceholder', {
      entity: i18n.t('app.deploymentPolicy.entity')
    })
  });

  this.deploymentPolicyInput.setManageOptions(deploymentPolicyManageOptions);
  this.deploymentPolicyInput.setManageOptionSelectCallback(function(option) {
    if (option.id === 'policy-create') {
      PlacementContextToolbarActions.createDeploymentPolicy();
    } else {
      PlacementContextToolbarActions.manageDeploymentPolicies();
    }
  });

  this.deploymentPolicyInput.setOptionSelectCallback(() => toggleButtonsState.call(this));

  addEventListeners.call(this);
}

PlacementsRowEditor.prototype.getEl = function() {
  return this.$el;
};

PlacementsRowEditor.prototype.setData = function(data) {
  if (this.data !== data) {
    var oldData = this.data || {};

    if (oldData.item !== data.item) {
      var placementObject = data.item;

      if (placementObject && placementObject.documentSelfLink) {
        this.$el.find('.title').html(i18n.t('app.placement.edit.update'));
      } else {
        this.$el.find('.title').html(i18n.t('app.placement.edit.createNew'));
        placementObject = {};
      }

      let groupInputValue = placementObject.group ? placementObject.group.id :
        placementObject.groupId;
      this.placementGroupInput.setValue(groupInputValue);
      this.resourcePoolInput.setSelectedOption(placementObject.resourcePool);
      this.deploymentPolicyInput.setSelectedOption(placementObject.deploymentPolicy);
      this.$el.find('.maxInstancesInput input').val(placementObject.maxNumberInstances);
      this.$el.find('.priorityInput input').val(placementObject.priority);
      this.$el.find('.nameInput input').val(placementObject.name);

      if ($.isNumeric(placementObject.memoryLimit)) {
        let size = utils.fromBytes(placementObject.memoryLimit);
        normalizeToKB(size);

        this.$el.find('.memoryLimitInput input').val(size.value);
        this.$el.find('.memoryLimitInput select').val(size.unit);
      } else {
        this.$el.find('.memoryLimitInput input').val('');
        this.$el.find('.memoryLimitInput select').val('MB');
      }

      if ($.isNumeric(placementObject.storageLimit)) {
        let size = utils.fromBytes(placementObject.storageLimit);
        normalizeToKB(size);

        this.$el.find('.storageLimitInput input').val(size.value);
        this.$el.find('.storageLimitInput select').val(size.unit);
      } else {
        this.$el.find('.storageLimitInput input').val('');
        this.$el.find('.storageLimitInput select').val('MB');
      }

      this.$el.find('.cpuSharesInput input').val(placementObject.cpuShares);
    }

    if (data.resourcePools === constants.LOADING) {
      this.resourcePoolInput.setLoading(true);
    } else {
      this.resourcePoolInput.setLoading(false);
      this.resourcePoolInput.setOptions(
          (data.resourcePools || []).map((config) => config.resourcePoolState));
    }

    if (oldData.selectedResourcePool !== data.selectedResourcePool && data.selectedResourcePool) {
      this.resourcePoolInput.setSelectedOption(data.selectedResourcePool.resourcePoolState);
    }

    // todo add loading for groups input
    this.placementGroupInput.setItems(data.groups);

    let oldSelectedGroup = oldData.item ? oldData.item.group : oldData.group;
    let selectedGroup = data.selectedGroup;
    if (!selectedGroup) {
      selectedGroup = data.item ? data.item.group : data.group;
    }
    if (oldSelectedGroup !== selectedGroup && selectedGroup) {
      this.placementGroupInput.setValue(selectedGroup.id ? selectedGroup.id : selectedGroup.name);
    }

    if (data.deploymentPolicies === constants.LOADING) {
      this.deploymentPolicyInput.setLoading(true);
    } else {
      this.deploymentPolicyInput.setLoading(false);
      this.deploymentPolicyInput.setOptions(data.deploymentPolicies);
    }

    if (oldData.selectedDeploymentPolicy !== data.selectedDeploymentPolicy &&
      data.selectedDeploymentPolicy) {
      this.deploymentPolicyInput.setSelectedOption(data.selectedDeploymentPolicy);
    }

    if (oldData.validationErrors !== data.validationErrors) {
      updateAlert.call(this, this.$el, data.validationErrors);
    }

    toggleButtonsState.call(this);

    this.data = data;
  }
};

var addEventListeners = function() {
  var _this = this;

  this.$el.find('.placementEditHolder').on('click', '.placementRowEdit-save', function(e) {
    e.preventDefault();

    $(e.currentTarget).addClass('loading');

    var toReturn = getPlacementModel.call(_this);

    if (toReturn.documentSelfLink) {
      PlacementActions.updatePlacement(toReturn);
    } else {
      PlacementActions.createPlacement(toReturn);
    }
  });

  this.$el.find('.placementEditHolder').on('click', '.placementRowEdit-cancel', function(e) {
    e.preventDefault();
    PlacementActions.cancelEditPlacement();
  });

  this.$el.on('change input', function() {
    toggleButtonsState.call(_this);
  });
};

var getPlacementModel = function() {
  var toReturn = {};
  if (this.data.item && this.data.item.documentSelfLink) {
    $.extend(toReturn, this.data.item);
  }

  toReturn.name = this.$el.find('.nameInput input').val();

  toReturn.groupId = this.placementGroupInput.getValue();
  toReturn.resourcePool = this.resourcePoolInput.getSelectedOption();
  toReturn.deploymentPolicy = this.deploymentPolicyInput.getSelectedOption();

  var maxNumberInstances = this.$el.find('.maxInstancesInput input').val();
  if ($.isNumeric(maxNumberInstances)) {
    toReturn.maxNumberInstances = maxNumberInstances;
  } else if (maxNumberInstances === '') {
    toReturn.maxNumberInstances = 0;
  }

  var priority = this.$el.find('.priorityInput input').val();
  if ($.isNumeric(priority)) {
    toReturn.priority = priority;
  }

  var memoryLimitVal = this.$el.find('.memoryLimitInput input').val();
  var memoryLimitUnit = this.$el.find('.memoryLimitInput select').val();
  if ($.isNumeric(memoryLimitVal)) {
    toReturn.memoryLimit = utils.toBytes(memoryLimitVal, memoryLimitUnit);
  }

  var cpuLimitVal = this.$el.find('.storageLimitInput input').val();
  var cpuLimitUnit = this.$el.find('.storageLimitInput select').val();
  if ($.isNumeric(cpuLimitVal)) {
    toReturn.storageLimit = utils.toBytes(cpuLimitVal, cpuLimitUnit);
  }

  var cpuShares = this.$el.find('.cpuSharesInput input').val();
  if ($.isNumeric(cpuShares)) {
    toReturn.cpuShares = cpuShares;
  }
  return toReturn;
};

var toggleButtonsState = function() {

  var resourcePool = this.resourcePoolInput.getSelectedOption();
  var maxNumberInstances = this.$el.find('.maxInstancesInput input').val();
  var memoryLimit = this.$el.find('.memoryLimitInput input').val();
  var cpuShares = this.$el.find('.cpuSharesInput input').val();

  var $verifyBtn = this.$el.find('.placementRowEdit-verify');
  $verifyBtn.removeClass('loading');

  var $saveBtn = this.$el.find('.placementRowEdit-save');
  $saveBtn.removeClass('loading');

  var groupClause = !utils.isApplicationEmbedded() || this.placementGroupInput.getValue();
  var maxNumberInstancesClause = !maxNumberInstances || $.isNumeric(maxNumberInstances)
                                                          && parseInt(maxNumberInstances, 10) >= 0;
  var memoryLimitClause = !memoryLimit
                            || $.isNumeric(memoryLimit) && parseInt(memoryLimit, 10) >= 0;
  var cpuSharesClause = !cpuShares
                            || $.isNumeric(cpuShares) && parseInt(cpuShares, 10) >= 0;

  let notEnoughInfo = !resourcePool || !maxNumberInstancesClause || !groupClause
                        || !memoryLimitClause || !cpuSharesClause;
  if (notEnoughInfo) {
    $saveBtn.attr('disabled', true);
  } else {
    $saveBtn.removeAttr('disabled');
  }
};

var updateAlert = function($el, errors) {
  this.alert.toggle($el, constants.ALERTS.TYPE.FAIL, errors && errors._generic);
};

var normalizeToKB = function(size) {
  if (size.unit === 'Bytes') {
    size.value /= 1000;
    size.unit = 'kB';
  }
};

/* An adapter that renders group or business group input based on the application type */
class GroupInput {
  constructor($containerEl, valueChangeCallback) {

    var $groupEl = $('<div>', {
      class: 'form-control dropdown-holder'
    });
    $containerEl.append($groupEl);

    if (utils.isApplicationEmbedded()) {

      this.businessGroupInput = new DropdownSearchMenu($groupEl, {
        title: i18n.t('app.placement.edit.selectBusinessGroup'),
        searchPlaceholder: i18n.t('dropdownSearchMenu.searchPlaceholder', {
          entity: i18n.t('app.businessGroup.entity')
        })
      });

      this.businessGroupInput.setOptionSelectCallback(valueChangeCallback);
      this.businessGroupInput.setClearOptionSelectCallback(valueChangeCallback);

    } else {

      this.groupInput = new DropdownSearchMenu($groupEl, {
        title: i18n.t('app.placement.edit.selectGroup'),
        searchPlaceholder: i18n.t('dropdownSearchMenu.searchPlaceholder', {
          entity: i18n.t('app.group.entity')
        })
      });

      this.groupInput.setManageOptions(GROUPS_MANAGE_OPTIONS);
      this.groupInput.setManageOptionSelectCallback(function(option) {
        if (option.id === 'group-create') {
          PlacementContextToolbarActions.createResourceGroup();
        } else {
          PlacementContextToolbarActions.manageResourceGroups();
        }
      });

      this.groupInput.setOptionSelectCallback(valueChangeCallback);
      this.groupInput.setClearOptionSelectCallback(valueChangeCallback);
    }
  }

  getValue() {
    let input = (this.groupInput) ? (this.groupInput) : this.businessGroupInput;
    let selectedGroupInstance = input.getSelectedOption();

    return selectedGroupInstance ? selectedGroupInstance.id : null;
  }

  setValue(groupId) {
    this.groupId = groupId;
    this.setGroupInstanceIfNeeded();
  }

  setItems(groups) {
    let input = (this.groupInput) ? (this.groupInput) : this.businessGroupInput;

    var adaptedGroups = [];
    if (groups) {
      for (var i = 0; i < groups.length; i++) {
        let group = groups[i];
        var groupInstance = {
          id: group.id ? group.id : utils.getDocumentId(group.documentSelfLink),
          name: group.label ? group.label : group.name

        };
        adaptedGroups.push(groupInstance);
      }
    }

    this.adaptedGroups = adaptedGroups;
    input.setOptions(adaptedGroups);

    this.setGroupInstanceIfNeeded();
  }

  setGroupInstanceIfNeeded() {
    let input = (this.groupInput) ? (this.groupInput) : this.businessGroupInput;

    if (this.groupId) {
      let selectedGroupInstance = this.adaptedGroups && this.adaptedGroups.find((groupInstance) => {
          return groupInstance.id === this.groupId || groupInstance.name === this.groupId;
        });

      if (selectedGroupInstance) {
        input.setSelectedOption(selectedGroupInstance);
      } else {
        input.setSelectedOption({
          id: this.groupId,
          name: this.groupId
        });
      }
    } else if (input) {
      input.setSelectedOption(null);
    }
  }
}

export default PlacementsRowEditor;
