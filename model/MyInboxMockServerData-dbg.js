/*
 * Copyright (C) 2009-2018 SAP SE or an SAP affiliate company. All rights reserved.
 */
jQuery.sap.declare("cross.fnd.fiori.inbox.model.MyInboxMockServerData"); 
cross.fnd.fiori.inbox.model.MyInboxMockServerData = function(){
};

cross.fnd.fiori.inbox.model.MyInboxMockServerData.decisionOptionsData = {
    d: {
      "__metadata": {
        "type": "Collection(TASKPROCESSING.DecisionOption)"
      },
      "results": [
        {
          "__metadata": {
            "type": "TASKPROCESSING.DecisionOption"
          },
          "InstanceID": "000001750567",
          "DecisionKey": "Approve",
          "DecisionText": "Approve",
          "CommentMandatory": false,
          "Nature": "POSITIVE"
        },
        {
          "__metadata": {
            "type": "TASKPROCESSING.DecisionOption"
          },
          "InstanceID": "000001750568",
          "DecisionKey": "Reject",
          "DecisionText": "Reject",
          "CommentMandatory": true,
          "Nature": "NEGATIVE"
        }
    ]}
};

cross.fnd.fiori.inbox.model.MyInboxMockServerData.decisionRejectData = {
	d:{
		"__metadata": {
		"id": "TaskCollection(SAP__Origin='Q7D_004_TGW',InstanceID='000001750569')",
		"uri": "TaskCollection(SAP__Origin='Q7D_004_TGW',InstanceID='000001750569')",
		"type": "TASKPROCESSING.Task",
		"content_type": "application/octet-stream",
		"media_src": "TaskCollection(SAP__Origin='Q7D_004_TGW',InstanceID='000001750569')/$value"
	},
	"SAP__Origin": "Q7D_004_TGW",
	"InstanceID": "000001750569",
	"TaskDefinitionID": "TS02700001",
	"TaskDefinitionName": "Employee Leaves",
	"TaskTitle": "Approve Leave Request for Sheetal",
	"Priority": "MEDIUM",
	"Status": "Completed",
	"StatusText": "StatusText 4",
	"CreatedOn": "/Date(1321765556000)/",
	"CreatedBy": "CreatedBy 4",
	"CreatedByName": "Vikram Rao",
	"Processor": "Processor 4",
	"ProcessorName": "ProcessorName 4",
	"SubstitutedUser": "SubstitutedUser 4",
	"SubstitutedUserName": "SubstitutedUserName 4",
	"StartDeadLine": "/Date(1068008756000)/",
	"CompletionDeadLine": "/Date(1035781556000)/",
	"ExpiryDate": "/Date(1197867956000)/",
	"IsEscalated": false,
	"SupportsComments": true,
	"HasComments": false,
	"SupportsAttachments": true,
	"HasAttachments": true,
	"HasPotentialOwners": true,
	"SupportsClaim": false,
	"SupportsRelease": false,
	"SupportsForward": true,
	"mime_type": "mime_type 4",
	"PriorityNumber": 5,
	"ScenarioID": "ScenarioID 4",
	"ForwardingUser": "ForwardingUser 4",
	"ForwardingUserName": "ForwardingUserName 4",
	"CompletedOn": "/Date(1321592756000)/",
	"ResumeOn": "/Date(1430715956000)/",
	"ForwardedOn": "/Date(1138856756000)/",
	"ForwardedUser": "ForwardedUser 4",
	"GUI_Link": null,
	"TaskDefinitionData": {
		"__deferred": {
			"uri": "TaskCollection(SAP__Origin='Q7D_004_TGW',InstanceID='000001750569')/TaskDefinitionData"
		}
	},
	"Description": {
		"__deferred": {
			"uri": "TaskCollection(SAP__Origin='Q7D_004_TGW',InstanceID='000001750569')/Description"
		}
	},
	"UIExecutionLink": {
		"__deferred": {
			"uri": "TaskCollection(SAP__Origin='Q7D_004_TGW',InstanceID='000001750569')/UIExecutionLink"
		}
	},
	"CustomAttributeData": {
		"__deferred": {
			"uri": "TaskCollection(SAP__Origin='Q7D_004_TGW',InstanceID='000001750569')/CustomAttributeData"
		}
	},
	"Comments": {
		"__deferred": {
			"uri": "TaskCollection(SAP__Origin='Q7D_004_TGW',InstanceID='000001750569')/Comments"
		}
	},
	"Attachments": {
		"__deferred": {
			"uri": "TaskCollection(SAP__Origin='Q7D_004_TGW',InstanceID='000001750569')/Attachments"
		}
	},
	"CreatedByDetails": {
		"__deferred": {
			"uri": "TaskCollection(SAP__Origin='Q7D_004_TGW',InstanceID='000001750569')/CreatedByDetails"
		}
	},
	"ProcessorDetails": {
		"__deferred": {
			"uri": "TaskCollection(SAP__Origin='Q7D_004_TGW',InstanceID='000001750569')/ProcessorDetails"
		}
	},
	"PossibleAgents": {
		"__deferred": {
			"uri": "TaskCollection(SAP__Origin='Q7D_004_TGW',InstanceID='000001750569')/PossibleAgents"
		}
	},
	"PotentialOwners": {
		"__deferred": {
			"uri": "TaskCollection(SAP__Origin='Q7D_004_TGW',InstanceID='000001750569')/PotentialOwners"
		}
	},
	"ProcessingLogs": {
		"__deferred": {
			"uri": "TaskCollection(SAP__Origin='Q7D_004_TGW',InstanceID='000001750569')/ProcessingLogs"
		}
	},
	"TaskObjects": {
		"__deferred": {
			"uri": "TaskCollection(SAP__Origin='Q7D_004_TGW',InstanceID='000001750569')/TaskObjects"
		}
	}
	}
 };


cross.fnd.fiori.inbox.model.MyInboxMockServerData.decisionData = {
	d:{
  	"__metadata": {
		"id": "TaskCollection(SAP__Origin='Q7D_004_TGW',InstanceID='000001750567')",
		"uri": "TaskCollection(SAP__Origin='Q7D_004_TGW',InstanceID='000001750567')",
		"type": "TASKPROCESSING.Task",
		"content_type": "application/octet-stream",
		"media_src": "TaskCollection(SAP__Origin='Q7D_004_TGW',InstanceID='000001750567')/$value"
	},
    "TaskSupports": {
		      "__metadata": {
		        "type": "TASKPROCESSING.TaskSupports"
		      },
      "AddAttachments": false,
      "AddComments": false,
      "Attachments": true,
      "Comments": true,
      "CreatedByDetails": true,
      "CustomAttributeData": true,
      "Description": true,
      "PossibleAgents": true,
      "PotentialOwners": true,
      "ProcessingLogs": true,
      "ProcessorDetails": true,
      "TaskDefinitionData": true,
      "TaskObject": true,
      "UIExecutionLink": true,
      "CancelResubmission": false,
      "Confirm": false,
      "Claim": false,
      "Forward": true,
      "Release": false,
      "Resubmit": false,
      "SetPriority": false
    },
	"SAP__Origin": "Q7D_004_TGW",
	"InstanceID": "000001750567",
	"TaskDefinitionID": "TS21500004",
	"TaskDefinitionName": "Approve Credit Limit",
	"TaskTitle": "Approve Credit Limit for Harry JI",
	"Priority": "HIGH",
	"Status": "Completed",
	"StatusText": "StatusText 1",
	"CreatedOn": "/Date(1424149556000)/",
	"CreatedBy": "CreatedBy 1",
	"CreatedByName": "Vikram Rao",
	"Processor": "Processor 1",
	"ProcessorName": "ProcessorName 1",
	"SubstitutedUser": "SubstitutedUser 1",
	"SubstitutedUserName": "SubstitutedUserName 1",
	"StartDeadLine": "/Date(1021352756000)/",
	"CompletionDeadLine": "/Date(1440651722000)/",
	"ExpiryDate": "/Date(1509253556000)/",
	"IsEscalated": true,
	"SupportsComments": true,
	"HasComments": true,
	"SupportsAttachments": true,
	"HasAttachments": true,
	"HasPotentialOwners": true,
	"SupportsClaim": true,
	"SupportsRelease": false,
	"SupportsForward": true,
	"mime_type": "mime_type 1",
	"PriorityNumber": 4,
	"ScenarioID": "ScenarioID 1",
	"ForwardingUser": "ForwardingUser 1",
	"ForwardingUserName": "ForwardingUserName 1",
	"CompletedOn": "/Date(1391538600000)/",
	"ResumeOn": "/Date(947912756000)/",
	"ForwardedOn": "/Date(1069995956000)/",
	"ForwardedUser": "ForwardedUser 1",
	"GUI_Link": null,
	"TaskDefinitionData": {
		"__deferred": {
			"uri": "TaskCollection(SAP__Origin='Q7D_004_TGW',InstanceID='000001750567')/TaskDefinitionData"
		}
	},
	"Description": {
		"__deferred": {
			"uri": "TaskCollection(SAP__Origin='Q7D_004_TGW',InstanceID='000001750567')/Description"
		}
	},
	"UIExecutionLink": {
		"__deferred": {
			"uri": "TaskCollection(SAP__Origin='Q7D_004_TGW',InstanceID='000001750567')/UIExecutionLink"
		}
	},
	"CustomAttributeData": {
		"__deferred": {
			"uri": "TaskCollection(SAP__Origin='Q7D_004_TGW',InstanceID='000001750567')/CustomAttributeData"
		}
	},
	"Comments": {
		"__deferred": {
			"uri": "TaskCollection(SAP__Origin='Q7D_004_TGW',InstanceID='000001750567')/Comments"
		}
	},
	"Attachments": {
		"__deferred": {
			"uri": "TaskCollection(SAP__Origin='Q7D_004_TGW',InstanceID='000001750567')/Attachments"
		}
	},
	"CreatedByDetails": {
		"__deferred": {
			"uri": "TaskCollection(SAP__Origin='Q7D_004_TGW',InstanceID='000001750567')/CreatedByDetails"
		}
	},
	"ProcessorDetails": {
		"__deferred": {
			"uri": "TaskCollection(SAP__Origin='Q7D_004_TGW',InstanceID='000001750567')/ProcessorDetails"
		}
	},
	"PossibleAgents": {
		"__deferred": {
			"uri": "TaskCollection(SAP__Origin='Q7D_004_TGW',InstanceID='000001750567')/PossibleAgents"
		}
	},
	"PotentialOwners": {
		"__deferred": {
			"uri": "TaskCollection(SAP__Origin='Q7D_004_TGW',InstanceID='000001750567')/PotentialOwners"
		}
	},
	"ProcessingLogs": {
		"__deferred": {
			"uri": "TaskCollection(SAP__Origin='Q7D_004_TGW',InstanceID='000001750567')/ProcessingLogs"
		}
	},
	"TaskObjects": {
		"__deferred": {
			"uri": "TaskCollection(SAP__Origin='Q7D_004_TGW',InstanceID='000001750567')/TaskObjects"
		}
	}
  }
 };

cross.fnd.fiori.inbox.model.MyInboxMockServerData.claimKamalData = {
	d: {
    "__metadata": {
      "id": "",
      "uri": "",
      "type": "TASKPROCESSING.Task",
      "content_type": "application/octet-stream",
      "media_src": ""
    },
    "TaskSupports": {
      "__metadata": {
        "type": "TASKPROCESSING.TaskSupports"
      },
      "AddAttachments": false,
      "AddComments": false,
      "Attachments": true,
      "Comments": true,
      "CreatedByDetails": true,
      "CustomAttributeData": true,
      "Description": true,
      "PossibleAgents": true,
      "PotentialOwners": true,
      "ProcessingLogs": true,
      "ProcessorDetails": true,
      "TaskDefinitionData": true,
      "TaskObject": true,
      "UIExecutionLink": true,
      "CancelResubmission": false,
      "Confirm": false,
      "Claim": false,
      "Forward": true,
      "Release": true,
      "Resubmit": false,
      "SetPriority": false
    },
    "SAP__Origin": "QE4910_TGW",
    "InstanceID": "000001504109",
    "TaskDefinitionID": "TS91000001_WS91000001_0000000004",
    "TaskDefinitionName": "",
    "TaskTitle": "Approve Employee Record Kamal",
    "Priority": "HIGH",
    "Status": "RESERVED",
    "StatusText": "",
    "CreatedOn": "\/Date(1457419075000)\/",
    "CreatedBy": "Kamal",
    "CreatedByName": "",
    "Processor": "HJ",
    "ProcessorName": "",
    "SubstitutedUser": "",
    "SubstitutedUserName": "",
    "StartDeadLine": null,
    "CompletionDeadLine": null,
    "ExpiryDate": null,
    "IsEscalated": false,
    "SupportsComments": true,
    "HasComments": false,
    "SupportsAttachments": true,
    "HasAttachments": true,
    "HasPotentialOwners": false,
    "SupportsClaim": true,
    "SupportsRelease": true,
    "SupportsForward": true,
    "mime_type": "",
    "PriorityNumber": 4,
    "ScenarioID": "",
    "ForwardingUser": "",
    "ForwardingUserName": "",
    "CompletedOn": null,
    "ResumeOn": null,
    "ForwardedOn": null,
    "ForwardedUser": "",
    "GUI_Link": "",
    "TaskDefinitionData": {
      "__deferred": {
        "uri": ""
      }
    },
    "Description": {
      "__deferred": {
        "uri": ""
      }
    },
    "UIExecutionLink": {
      "__deferred": {
        "uri": ""
      }
    },
    "CustomAttributeData": {
      "__deferred": {
        "uri": ""
      }
    },
    "Comments": {
      "__deferred": {
        "uri": ""
      }
    },
    "Attachments": {
      "__deferred": {
        "uri": ""
      }
    },
    "CreatedByDetails": {
      "__deferred": {
        "uri": ""
      }
    },
    "ProcessorDetails": {
      "__deferred": {
        "uri": ""
      }
    },
    "PossibleAgents": {
      "__deferred": {
        "uri": ""
      }
    },
    "PotentialOwners": {
      "__deferred": {
        "uri": ""
      }
    },
    "ProcessingLogs": {
      "__deferred": {
        "uri": ""
      }
    },
    "TaskObjects": {
      "__deferred": {
        "uri": ""
      }
    }
  }
};

cross.fnd.fiori.inbox.model.MyInboxMockServerData.claimMannaData = {
	d: {
    "__metadata": {
      "id": "",
      "uri": "",
      "type": "TASKPROCESSING.Task",
      "content_type": "application/octet-stream",
      "media_src": ""
    },
    "TaskSupports": {
      "__metadata": {
        "type": "TASKPROCESSING.TaskSupports"
      },
      "AddAttachments": false,
      "AddComments": false,
      "Attachments": true,
      "Comments": true,
      "CreatedByDetails": true,
      "CustomAttributeData": true,
      "Description": true,
      "PossibleAgents": true,
      "PotentialOwners": true,
      "ProcessingLogs": true,
      "ProcessorDetails": true,
      "TaskDefinitionData": true,
      "TaskObject": true,
      "UIExecutionLink": true,
      "CancelResubmission": false,
      "Confirm": false,
      "Claim": false,
      "Forward": true,
      "Release": true,
      "Resubmit": false,
      "SetPriority": false
    },
    "SAP__Origin": "QE4910_TGW",
    "InstanceID": "000001532210",
    "TaskDefinitionID": "TS91000001_WS91000001_0000000004",
    "TaskDefinitionName": "",
    "TaskTitle": "Approve Employee Record Manna",
    "Priority": "HIGH",
    "Status": "RESERVED",
    "StatusText": "",
    "CreatedOn": "\/Date(1457419075000)\/",
    "CreatedBy": "Manna",
    "CreatedByName": "Manna",
    "Processor": "HJ",
    "ProcessorName": "",
    "SubstitutedUser": "",
    "SubstitutedUserName": "",
    "StartDeadLine": null,
    "CompletionDeadLine": null,
    "ExpiryDate": null,
    "IsEscalated": false,
    "SupportsComments": true,
    "HasComments": false,
    "SupportsAttachments": true,
    "HasAttachments": true,
    "HasPotentialOwners": false,
    "SupportsClaim": true,
    "SupportsRelease": true,
    "SupportsForward": true,
    "mime_type": "",
    "PriorityNumber": 4,
    "ScenarioID": "",
    "ForwardingUser": "",
    "ForwardingUserName": "",
    "CompletedOn": null,
    "ResumeOn": null,
    "ForwardedOn": null,
    "ForwardedUser": "",
    "GUI_Link": "",
    "TaskDefinitionData": {
      "__deferred": {
        "uri": ""
      }
    },
    "Description": {
      "__deferred": {
        "uri": ""
      }
    },
    "UIExecutionLink": {
      "__deferred": {
        "uri": ""
      }
    },
    "CustomAttributeData": {
      "__deferred": {
        "uri": ""
      }
    },
    "Comments": {
      "__deferred": {
        "uri": ""
      }
    },
    "Attachments": {
      "__deferred": {
        "uri": ""
      }
    },
    "CreatedByDetails": {
      "__deferred": {
        "uri": ""
      }
    },
    "ProcessorDetails": {
      "__deferred": {
        "uri": ""
      }
    },
    "PossibleAgents": {
      "__deferred": {
        "uri": ""
      }
    },
    "PotentialOwners": {
      "__deferred": {
        "uri": ""
      }
    },
    "ProcessingLogs": {
      "__deferred": {
        "uri": ""
      }
    },
    "TaskObjects": {
      "__deferred": {
        "uri": ""
      }
    }
  }
};

cross.fnd.fiori.inbox.model.MyInboxMockServerData.claimDavidData = {
	d: {
    "__metadata": {
      "id": "",
      "uri": "",
      "type": "TASKPROCESSING.Task",
      "content_type": "application/octet-stream",
      "media_src": ""
    },
    "TaskSupports": {
      "__metadata": {
        "type": "TASKPROCESSING.TaskSupports"
      },
      "AddAttachments": false,
      "AddComments": false,
      "Attachments": true,
      "Comments": true,
      "CreatedByDetails": true,
      "CustomAttributeData": true,
      "Description": true,
      "PossibleAgents": true,
      "PotentialOwners": true,
      "ProcessingLogs": true,
      "ProcessorDetails": true,
      "TaskDefinitionData": true,
      "TaskObject": true,
      "UIExecutionLink": true,
      "CancelResubmission": false,
      "Confirm": false,
      "Claim": false,
      "Forward": true,
      "Release": true,
      "Resubmit": false,
      "SetPriority": false
    },
    "SAP__Origin": "QE4910_TGW",
    "InstanceID": "000001532231",
    "TaskDefinitionID": "TS91000001_WS91000001_0000000004",
    "TaskDefinitionName": "",
    "TaskTitle": "Approve Employee Record David",
    "Priority": "HIGH",
    "Status": "RESERVED",
    "StatusText": "",
    "CreatedOn": "\/Date(1457419075000)\/",
    "CreatedBy": "David",
    "CreatedByName": "David",
    "Processor": "HJ",
    "ProcessorName": "",
    "SubstitutedUser": "",
    "SubstitutedUserName": "",
    "StartDeadLine": null,
    "CompletionDeadLine": null,
    "ExpiryDate": null,
    "IsEscalated": false,
    "SupportsComments": true,
    "HasComments": false,
    "SupportsAttachments": true,
    "HasAttachments": true,
    "HasPotentialOwners": false,
    "SupportsClaim": true,
    "SupportsRelease": true,
    "SupportsForward": true,
    "mime_type": "",
    "PriorityNumber": 4,
    "ScenarioID": "",
    "ForwardingUser": "",
    "ForwardingUserName": "",
    "CompletedOn": null,
    "ResumeOn": null,
    "ForwardedOn": null,
    "ForwardedUser": "",
    "GUI_Link": "",
    "TaskDefinitionData": {
      "__deferred": {
        "uri": ""
      }
    },
    "Description": {
      "__deferred": {
        "uri": ""
      }
    },
    "UIExecutionLink": {
      "__deferred": {
        "uri": ""
      }
    },
    "CustomAttributeData": {
      "__deferred": {
        "uri": ""
      }
    },
    "Comments": {
      "__deferred": {
        "uri": ""
      }
    },
    "Attachments": {
      "__deferred": {
        "uri": ""
      }
    },
    "CreatedByDetails": {
      "__deferred": {
        "uri": ""
      }
    },
    "ProcessorDetails": {
      "__deferred": {
        "uri": ""
      }
    },
    "PossibleAgents": {
      "__deferred": {
        "uri": ""
      }
    },
    "PotentialOwners": {
      "__deferred": {
        "uri": ""
      }
    },
    "ProcessingLogs": {
      "__deferred": {
        "uri": ""
      }
    },
    "TaskObjects": {
      "__deferred": {
        "uri": ""
      }
    }
  }
};

cross.fnd.fiori.inbox.model.MyInboxMockServerData.claimMannaData = {
	d: {
    "__metadata": {
      "id": "",
      "uri": "",
      "type": "TASKPROCESSING.Task",
      "content_type": "application/octet-stream",
      "media_src": ""
    },
    "TaskSupports": {
      "__metadata": {
        "type": "TASKPROCESSING.TaskSupports"
      },
      "AddAttachments": false,
      "AddComments": false,
      "Attachments": true,
      "Comments": true,
      "CreatedByDetails": true,
      "CustomAttributeData": true,
      "Description": true,
      "PossibleAgents": true,
      "PotentialOwners": true,
      "ProcessingLogs": true,
      "ProcessorDetails": true,
      "TaskDefinitionData": true,
      "TaskObject": true,
      "UIExecutionLink": true,
      "CancelResubmission": false,
      "Confirm": false,
      "Claim": false,
      "Forward": true,
      "Release": true,
      "Resubmit": false,
      "SetPriority": false
    },
    "SAP__Origin": "QE4910_TGW",
    "InstanceID": "000001532210",
    "TaskDefinitionID": "TS91000001_WS91000001_0000000004",
    "TaskDefinitionName": "",
    "TaskTitle": "Approve Employee Record Manna",
    "Priority": "HIGH",
    "Status": "RESERVED",
    "StatusText": "",
    "CreatedOn": "\/Date(1457419075000)\/",
    "CreatedBy": "Manna",
    "CreatedByName": "Manna",
    "Processor": "HJ",
    "ProcessorName": "",
    "SubstitutedUser": "",
    "SubstitutedUserName": "",
    "StartDeadLine": null,
    "CompletionDeadLine": null,
    "ExpiryDate": null,
    "IsEscalated": false,
    "SupportsComments": true,
    "HasComments": false,
    "SupportsAttachments": true,
    "HasAttachments": true,
    "HasPotentialOwners": false,
    "SupportsClaim": true,
    "SupportsRelease": true,
    "SupportsForward": true,
    "mime_type": "",
    "PriorityNumber": 4,
    "ScenarioID": "",
    "ForwardingUser": "",
    "ForwardingUserName": "",
    "CompletedOn": null,
    "ResumeOn": null,
    "ForwardedOn": null,
    "ForwardedUser": "",
    "GUI_Link": "",
    "TaskDefinitionData": {
      "__deferred": {
        "uri": ""
      }
    },
    "Description": {
      "__deferred": {
        "uri": ""
      }
    },
    "UIExecutionLink": {
      "__deferred": {
        "uri": ""
      }
    },
    "CustomAttributeData": {
      "__deferred": {
        "uri": ""
      }
    },
    "Comments": {
      "__deferred": {
        "uri": ""
      }
    },
    "Attachments": {
      "__deferred": {
        "uri": ""
      }
    },
    "CreatedByDetails": {
      "__deferred": {
        "uri": ""
      }
    },
    "ProcessorDetails": {
      "__deferred": {
        "uri": ""
      }
    },
    "PossibleAgents": {
      "__deferred": {
        "uri": ""
      }
    },
    "PotentialOwners": {
      "__deferred": {
        "uri": ""
      }
    },
    "ProcessingLogs": {
      "__deferred": {
        "uri": ""
      }
    },
    "TaskObjects": {
      "__deferred": {
        "uri": ""
      }
    }
  }
};

cross.fnd.fiori.inbox.model.MyInboxMockServerData.releaseMannaData = {
	d: {
    "__metadata": {
      "id": "",
      "uri": "",
      "type": "TASKPROCESSING.Task",
      "content_type": "application/octet-stream",
      "media_src": ""
    },
    "TaskSupports": {
      "__metadata": {
        "type": "TASKPROCESSING.TaskSupports"
      },
      "AddAttachments": false,
      "AddComments": false,
      "Attachments": true,
      "Comments": true,
      "CreatedByDetails": true,
      "CustomAttributeData": true,
      "Description": true,
      "PossibleAgents": true,
      "PotentialOwners": true,
      "ProcessingLogs": true,
      "ProcessorDetails": true,
      "TaskDefinitionData": true,
      "TaskObject": true,
      "UIExecutionLink": true,
      "CancelResubmission": false,
      "Confirm": false,
      "Claim": true,
      "Forward": true,
      "Release": false,
      "Resubmit": false,
      "SetPriority": false
    },
    "SAP__Origin": "QE4910_TGW",
    "InstanceID": "000001532210",
    "TaskDefinitionID": "TS91000001_WS91000001_0000000004",
    "TaskDefinitionName": "",
    "TaskTitle": "Approve Employee Record Manna",
    "Priority": "HIGH",
    "Status": "READY",
    "StatusText": "",
    "CreatedOn": "\/Date(1457419075000)\/",
    "CreatedBy": "Manna",
    "CreatedByName": "Manna",
    "Processor": "HJ",
    "ProcessorName": "",
    "SubstitutedUser": "",
    "SubstitutedUserName": "",
    "StartDeadLine": null,
    "CompletionDeadLine": null,
    "ExpiryDate": null,
    "IsEscalated": false,
    "SupportsComments": true,
    "HasComments": false,
    "SupportsAttachments": true,
    "HasAttachments": true,
    "HasPotentialOwners": false,
    "SupportsClaim": true,
    "SupportsRelease": true,
    "SupportsForward": true,
    "mime_type": "",
    "PriorityNumber": 4,
    "ScenarioID": "",
    "ForwardingUser": "",
    "ForwardingUserName": "",
    "CompletedOn": null,
    "ResumeOn": null,
    "ForwardedOn": null,
    "ForwardedUser": "",
    "GUI_Link": "",
    "TaskDefinitionData": {
      "__deferred": {
        "uri": ""
      }
    },
    "Description": {
      "__deferred": {
        "uri": ""
      }
    },
    "UIExecutionLink": {
      "__deferred": {
        "uri": ""
      }
    },
    "CustomAttributeData": {
      "__deferred": {
        "uri": ""
      }
    },
    "Comments": {
      "__deferred": {
        "uri": ""
      }
    },
    "Attachments": {
      "__deferred": {
        "uri": ""
      }
    },
    "CreatedByDetails": {
      "__deferred": {
        "uri": ""
      }
    },
    "ProcessorDetails": {
      "__deferred": {
        "uri": ""
      }
    },
    "PossibleAgents": {
      "__deferred": {
        "uri": ""
      }
    },
    "PotentialOwners": {
      "__deferred": {
        "uri": ""
      }
    },
    "ProcessingLogs": {
      "__deferred": {
        "uri": ""
      }
    },
    "TaskObjects": {
      "__deferred": {
        "uri": ""
      }
    }
  }
};

cross.fnd.fiori.inbox.model.MyInboxMockServerData.releaseKamalData = {
	d: {
    "__metadata": {
      "id": "",
      "uri": "",
      "type": "TASKPROCESSING.Task",
      "content_type": "application/octet-stream",
      "media_src": ""
    },
    "TaskSupports": {
      "__metadata": {
        "type": "TASKPROCESSING.TaskSupports"
      },
      "AddAttachments": false,
      "AddComments": false,
      "Attachments": true,
      "Comments": true,
      "CreatedByDetails": true,
      "CustomAttributeData": true,
      "Description": true,
      "PossibleAgents": true,
      "PotentialOwners": true,
      "ProcessingLogs": true,
      "ProcessorDetails": true,
      "TaskDefinitionData": true,
      "TaskObject": true,
      "UIExecutionLink": true,
      "CancelResubmission": false,
      "Confirm": false,
      "Claim": true,
      "Forward": true,
      "Release": false,
      "Resubmit": false,
      "SetPriority": false
    },
    "SAP__Origin": "QE4910_TGW",
    "InstanceID": "000001504109",
    "TaskDefinitionID": "TS91000001_WS91000001_0000000004",
    "TaskDefinitionName": "",
    "TaskTitle": "Approve Employee Record Kamal",
    "Priority": "HIGH",
    "Status": "READY",
    "StatusText": "",
    "CreatedOn": "\/Date(1457419075000)\/",
    "CreatedBy": "Kamal",
    "CreatedByName": "",
    "Processor": "HJ",
    "ProcessorName": "",
    "SubstitutedUser": "",
    "SubstitutedUserName": "",
    "StartDeadLine": null,
    "CompletionDeadLine": null,
    "ExpiryDate": null,
    "IsEscalated": false,
    "SupportsComments": true,
    "HasComments": false,
    "SupportsAttachments": true,
    "HasAttachments": true,
    "HasPotentialOwners": false,
    "SupportsClaim": true,
    "SupportsRelease": true,
    "SupportsForward": true,
    "mime_type": "",
    "PriorityNumber": 4,
    "ScenarioID": "",
    "ForwardingUser": "",
    "ForwardingUserName": "",
    "CompletedOn": null,
    "ResumeOn": null,
    "ForwardedOn": null,
    "ForwardedUser": "",
    "GUI_Link": "",
    "TaskDefinitionData": {
      "__deferred": {
        "uri": ""
      }
    },
    "Description": {
      "__deferred": {
        "uri": ""
      }
    },
    "UIExecutionLink": {
      "__deferred": {
        "uri": ""
      }
    },
    "CustomAttributeData": {
      "__deferred": {
        "uri": ""
      }
    },
    "Comments": {
      "__deferred": {
        "uri": ""
      }
    },
    "Attachments": {
      "__deferred": {
        "uri": ""
      }
    },
    "CreatedByDetails": {
      "__deferred": {
        "uri": ""
      }
    },
    "ProcessorDetails": {
      "__deferred": {
        "uri": ""
      }
    },
    "PossibleAgents": {
      "__deferred": {
        "uri": ""
      }
    },
    "PotentialOwners": {
      "__deferred": {
        "uri": ""
      }
    },
    "ProcessingLogs": {
      "__deferred": {
        "uri": ""
      }
    },
    "TaskObjects": {
      "__deferred": {
        "uri": ""
      }
    }
  }
};



cross.fnd.fiori.inbox.model.MyInboxMockServerData.resubmitData = {
	d: {
	"__metadata": {
		"id": "TaskCollection(SAP__Origin='QE4910_TGW',InstanceID='000001532210')",
		"uri": "TaskCollection(SAP__Origin='QE4910_TGW',InstanceID='000001532210')",
		"type": "TASKPROCESSING.Task",
		"content_type": "application/octet-stream",
		"media_src": "TaskCollection(SAP__Origin='QE4910_TGW',InstanceID='000001532210')/$value"
	},
	"TaskSupports": {
		"__metadata": {
			"type": "TASKPROCESSING.TaskSupports"
		},
		"AddAttachments": true,
		"AddComments": true,
		"Attachments": true,
		"Comments": true,
		"CreatedByDetails": true,
		"CustomAttributeData": true,
		"Description": true,
		"PossibleAgents": true,
		"PotentialOwners": true,
		"ProcessingLogs": true,
		"ProcessorDetails": true,
		"TaskDefinitionData": true,
		"TaskObject": true,
		"UIExecutionLink": true,
		"CancelResubmission": false,
		"Confirm": false,
		"Claim": false,
		"Forward": true,
		"Release": true,
		"Resubmit": true,
		"SetPriority": true
	},
	"SAP__Origin": "QE4910_TGW",
	"InstanceID": "000001532210",
	"TaskDefinitionID": "TS91000001_WS91000001_0000000004",
	"TaskDefinitionName": "",
	"TaskTitle": "Approve Employee Record Manna",
	"Priority": "HIGH",
	"Status": "FOR_RESUBMISSION",
	"StatusText": "",
	"CreatedOn": "\/Date(1435531158000)\/",
	"CreatedBy": "Manna",
	"CreatedByName": "Manna",
	"CompletionDeadLine": null,
	"SupportsComments": true,
	"SupportsAttachments": true,
	"HasAttachments": true,
	"PriorityNumber": 5,
	"GUI_Link": "sap/bc/gui/sap/its/webgui/?sap-client=910&sap-language=EN&~transaction=*SWNWIEX P_WI_ID=000001532210;P_APPL=UWL;P_ACTION=EXECUTE;DYNP_OKCODE=ONLI",
	"CustomAttributeData": {
		"__deferred": {
			"uri": "TaskCollection(SAP__Origin='QE4910_TGW',InstanceID='000001532210')/CustomAttributeData"
		}
	}
}
};

cross.fnd.fiori.inbox.model.MyInboxMockServerData.searchUsers = {
	"d": {
	"results": [{
			"__metadata": {
				"id": "UserInfoCollection(SAP__Origin='NA',UniqueName='test2')",
				"uri": "UserInfoCollection(SAP__Origin='NA',UniqueName='test2')",
				"type": "TASKPROCESSING.UserInfo",
				"content_type": "application/octet-stream",
				"media_src": "UserInfoCollection(SAP__Origin='NA',UniqueName='test2')/$value",
				"edit_media": "UserInfoCollection(SAP__Origin='NA',UniqueName='test2')/$value"
			},
			"SAP__Origin": "NA",
			"Address": {
				"__metadata": {
					"type": "TASKPROCESSING.Address"
				},
				"Street": null,
				"StreetNumber": null,
				"City": null,
				"PostalCode": null,
				"State": null,
				"Country": ""
			},
			"UniqueName": "test2",
			"DisplayName": "test2 ",
			"FirstName": null,
			"LastName": "test2",
			"Email": null,
			"WorkPhone": null,
			"MobilePhone": null,
			"mime_type": null
		}
	]
}	
};