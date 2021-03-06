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

package network

import (
	"bytes"
	"encoding/json"
	"fmt"
	"net/http"
	"os"

	"admiral/auth"
	"admiral/client"
	"admiral/config"
	"admiral/functions"
)

func (nl *NetworkList) FetchNetworks() (int, error) {
	url := config.URL + "/resources/container-networks?expand"
	req, err := http.NewRequest("GET", url, nil)
	_, respBody, respErr := client.ProcessRequest(req)
	if respErr != nil {
		return 0, respErr
	}
	err = json.Unmarshal(respBody, nl)
	functions.CheckJson(err)
	return len(nl.DocumentLinks), nil
}

func (nl *NetworkList) Print() {
	fmt.Printf("%-20s\n", "NAME")
	for _, link := range nl.DocumentLinks {
		val := nl.Documents[link]
		fmt.Printf("%-20s\n", val.Name)
	}
}

func RemoveNetwork(name string) bool {
	nl := &NetworkList{}
	nl.FetchNetworks()
	for _, link := range nl.DocumentLinks {
		val := nl.Documents[link]
		if name == val.Name {
			url := config.URL + link
			req, _ := http.NewRequest("DELETE", url, nil)
			_, _, respErr := client.ProcessRequest(req)
			if respErr != nil {
				return false
			}
			return true
		}
	}
	return false
}

func InspectNetwork(name string) (bool, string) {
	nl := &NetworkList{}
	nl.FetchNetworks()
	for _, link := range nl.DocumentLinks {
		val := nl.Documents[link]
		if name == val.Name {
			url := config.URL + link
			req, _ := http.NewRequest("GET", url, nil)
			_, respBody, respErr := client.ProcessRequest(req)
			if respErr != nil {
				return false, ""
			}
			n := &Network{}
			err := json.Unmarshal(respBody, n)
			functions.CheckJson(err)
			return true, n.String()
		}
	}
	return false, ""
}

func (n *Network) Create() (bool, string) {
	if n.Name == "" {
		fmt.Println("Network create failed. Name was not set.")
		os.Exit(0)
	}
	url := config.URL + "/resources/container-networks"
	jsonBody, err := json.Marshal(n)
	functions.CheckJson(err)

	req, err := http.NewRequest("POST", url, bytes.NewBuffer(jsonBody))
	resp, respBody, respErr := client.ProcessRequest(req)
	if respErr != nil {
		return false, ""
	}
	msg := &auth.Error{}
	json.Unmarshal(respBody, msg)
	if resp.StatusCode != 200 {
		return false, msg.Message
	}
	return true, ""
}
