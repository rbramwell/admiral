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

package com.vmware.admiral.compute.content;

import java.util.HashMap;
import java.util.Map;

import com.fasterxml.jackson.annotation.JsonAnyGetter;
import com.fasterxml.jackson.annotation.JsonAnySetter;
import com.fasterxml.jackson.annotation.JsonFilter;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

import com.vmware.photon.controller.model.resources.ComputeDescriptionService;

/**
 * This class exists for serialization/deserialization purposes only
 */
@JsonFilter(YamlMapper.SERVICE_DOCUMENT_FILTER)
@JsonIgnoreProperties({ "customProperties" })
public class ComputeDescription extends ComputeDescriptionService.ComputeDescription {

    @JsonAnySetter
    private void putProperty(String key, String value) {
        if (customProperties == null) {
            customProperties = new HashMap<>();
        }
        customProperties.put(key, value);
    }

    @JsonAnyGetter
    private Map<String, String> getProperties() {
        return customProperties;
    }
}
