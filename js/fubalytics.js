//the fubalytics connector requires jQuery.

//create the object to use
var fubalytics={
	userid:0,
	fubalytics_url:"",
	auth_token: "",

	get_or_create_club:function(name){
		/**
		name: the name of the club.
		returns the fubalytics club id
		**/
		var club_id=null;
		$.ajax({
			url:this.fubalytics_url+"/api/clubs/get_or_create.json",
			type: "GET",
			async: false,
			data: {clubname:name,
				auth_token:this.auth_token},
			dataType: "json",
			context: document.body,
			success:function(d,s,x){
				console.log(d);
				club_id=d[0].club.id;
				console.log("received club id: "+club_id);
			},
			error:function(d,s,x){
				console.error(d);
				throw "Error on getting the club id: "+d.responseJSON;

			}

		});
		return club_id;

	},

	/**
	= Setup New User
	create a new user in the fubalytics system.
	It throws an exception if not all parameters have been provided.
	== Params:
		* fubalytics_club_id: The id of the club, IN the fubalytics system
		* internal_user_id: the ID of the user in YOUR system. It will be mapped to the user ID in the fubalytics system.
		* email: The email of the user. Is required for payment processes.
		* firstname (for later payment support)
		* lastname (for later payment support)
		* language: Set the language of the user. supported strings: "de", "en", "pt", "ru", "es"
	**/
	setup_new_user:function(inp){
		/**the obj must have
		the following properties:
		* fubalytics_club_id, 
		* internal_user_id, (the User ID of the user IN THE fubalytics system)
		* language, 
		If one of them is not set, an exception is thrown

		The proccess performs following steps:
		1. get or create a club_id
		2. create a user (email, firstname, lastname, club_id)
		3. submit all new players
		**/
		check=this.check_params(inp, ["club_id", "internal_user_id", "firstname", "lastname", "email", "language"])
		if (!check.result){
			throw check.messages.join();
		}
		this.check_auth_token();
		this.check_server_url();

		//---------------
		//	create the user with the received club id
		//--------------
		//setup the arbitrary token 
		var arb_token=JSON.stringify({external_user_id:inp.internal_user_id});
		var result;
		$.ajax({
			url:this.fubalytics_url+"/api/users.json",
			type: "POST",
			async: false,
			data: {email:inp.email,
				firstname: inp.firstname, 
				lastname: inp.lastname, 
				club_id: inp.club_id,
				language: inp.language,
				arb_token:arb_token,
				auth_token:this.auth_token},
			dataType: "json",
			context: document.body,
			success:function(d,s,x){
				console.log(d);
				result= d.user_id;
				
			},
			error:function(d,s,x){
				console.error(d);
				console.error(s);
				console.error(x);
				throw "Error on creating the user: "+d.responseText;

			}

		});
		return result;
	},

	/**
	This method gets the fubalytics user data as a 
	json object. 
	== Params:
	* internal_id: Your internal user id.
	**/
	get_user_data:function(internal_id){
		var result;
		$.ajax({
			url:this.fubalytics_url+"/api/users/find_by_arb_token.json",
			type: "GET",
			async: false,
			data: {query:"external_user_id\":"+internal_id+"}",
				auth_token:this.auth_token},
			dataType: "json",
			context: document.body,
			success:function(d,s,x){
				console.log(d);
				result=d.user;
			},
			error:function(d,s,x){
				console.error(d);
				throw "Error on getting the user: "+d.responseText;

			}

		});
		return result;

	},

	get_team_ranks:function(){
		var result;
		$.ajax({
			url:this.fubalytics_url+"/api/team_ranks.json",
			type: "GET",
			async: false,
			data: {auth_token:this.auth_token},
			dataType: "json",
			context: document.body,
			success:function(d,s,x){
				console.log(d);
				result=d;
			},
			error:function(d,s,x){
				console.error(d);
				throw "Error on getting the user: "+d.responseText;
			}

		});
		return result;
	},

	/**
	returns a list of available team types in the fubalytics
	system 
	**/
	get_team_types:function(){
		var result;
		$.ajax({
			url:this.fubalytics_url+"/api/team_types.json",
			type: "GET",
			async: false,
			data: {auth_token:this.auth_token},
			dataType: "json",
			context: document.body,
			success:function(d,s,x){
				console.log(d);
				result=d;
			},
			error:function(d,s,x){
				console.error(d);
				throw "Error on getting the team types: "+d.responseText;
			}

		});
		return result;
	},

	/**
	returns a list of available team types in the fubalytics
	system 
	**/
	get_event_types:function(){
		var result;
		$.ajax({
			url:this.fubalytics_url+"/api/event_types.json",
			type: "GET",
			async: false,
			data: {auth_token:this.auth_token},
			dataType: "json",
			context: document.body,
			success:function(d,s,x){
				console.log(d);
				result=d;
			},
			error:function(d,s,x){
				console.error(d);
				throw "Error on getting the event types: "+d.responseText;
			}

		});
		return result;
	},

	
	/**
	Submits multiple new players to the fubalytics system.
	The format of the object must be e.g.
	var input={fubalytics_user_id:33, 
		players:[{firstname:"Mario", lastname:"Gomez", birthdate:nil, nr:10, position_id:22}, 
				{firstname:"Lukas", lastname:"Podolski", birthdate:123456789, nr:11, position_id:21}]};
	**/
	create_players:function(input){
		var result;
		$.ajax({
			url:this.fubalytics_url+"/api/players/batch_create_e2c.json",
			type: "POST",
			async: false,
			data: this.merge_options({auth_token:this.auth_token}, input),
			dataType: "json",
			context: document.body,
			success:function(d,s,x){
				console.log(d);
				result=d;
			},
			error:function(d,s,x){
				console.error(d);
				throw "Error on getting the user: "+d.responseText;
			}

		});
		return result;
	},

	/**
	Searches the fubalytics database for a player with the
	given external ID (in your system). The player must be setup before with a
	suitable arbitrary token. e.g. {external_id:3}.
	@param arb_token: String. Pass here the token, you would like to search for.
	e.g. {e2c_id:3}
	**/
	find_player_by_arb_token:function(input){
		var result;
		$.ajax({
			url:this.fubalytics_url+"/api/players/find_by_arb_token.json",
			type: "GET",
			async: false,
			data: {query:input.arb_token,
				auth_token:this.auth_token},
			dataType: "json",
			context: document.body,
			success:function(d,s,x){
				result=d;
			},
			error:function(d,s,x){
				console.error(d);
				throw "Error on getting the players: "+d.responseText;
			}

		});
		return result;
	},


	/**
	Deletes a player from the fubalytics system. 
	TODO
	**/
	delete_player:function(input){
		var result;
		$.ajax({
			url:this.fubalytics_url+"/api/players/.json",
			type: "DELETE",
			async: false,
			data: this.merge_options({auth_token:this.auth_token}, input),
			dataType: "json",
			context: document.body,
			success:function(d,s,x){
				console.log(d);
				result=d;
			},
			error:function(d,s,x){
				console.error(d);
				throw "Error on getting the user: "+d.responseText;
			}

		});
		return result;

	},


	/**
	Shows the player profile with its game statistics in a iframe
	@param target_node: The dom node, where the IFrame will be placed into
	@param fubalytics_player_id: The player ID in the fubalytics System. 
	You can get it by using the method find_player_by_arb_token(...).
	@param external_user_id: The ID of the user, in YOUR system.

	**/
	create_iframe_player_profile:function(input){
		console.log(input);
		check=this.check_params(input, ["target_node", "fubalytics_player_id", "external_user_id"])
		if (!check.result){
			throw check.messages.join();
		}
		this.check_auth_token();
		this.check_server_url();

		var fubalytics_user=fubalytics.get_user_data(input.external_user_id);

		ifrm = document.createElement("IFRAME"); 
		ifrm.setAttribute("src", this.fubalytics_url+"/api/players/"+input.fubalytics_player_id+
			"?auth_token="+this.auth_token+"&as_user_id="+fubalytics_user.id); 
		ifrm.style.width = "100%";
		ifrm.style.height = "100%"; //inp.target_node.height()+50;  
		input.target_node.append(ifrm); 

	},


	

	/**
	Creates an IFrame in the provided node.
	@param inp: options object containing:
	@param target_node: The dom node, where the IFrame should
	be placed into.
	@param fubalytics_user_id: The user ID of the user inside the fubalytics system. Use the
		method get_user_data(your_user_id) to get it!
	**/
	create_iframe_videos_index:function(inp){
		console.log(inp);
		console.log("node width:"+inp.target_node.width()+", height:"+inp.target_node.height());
		check=this.check_params(inp, ["target_node", "fubalytics_user_id"])
		if (!check.result){
			throw check.messages.join();
		}
		this.check_auth_token();
		this.check_server_url();

		ifrm = document.createElement("IFRAME"); 
		ifrm.setAttribute("src", this.fubalytics_url+"/api/recordings?auth_token="+this.auth_token+"&as_user_id="+inp.fubalytics_user_id); 
		ifrm.style.width = "100%";
		ifrm.style.height = "100%"; //inp.target_node.height()+50;  
		inp.target_node.append(ifrm); 
	},


	/**
	Sets up an iframe in a given node 
	so the user may upload a new video.
	Input:
		@param taget_node: dom node (e.g. $("mynode") if you use jquery)
		@param external_user_id: The user ID of the user inside your system. Use the
		@param club1_name
		@param club2_name
		@game_time the unix timestamp for the game time
		@arb_token: Object of type e.g. {gamedate_id:342}. It will be stored in the recording so you can find the recording later again
		using your internal gamedate_id. 
		You can pass arbitrary json objects. e.g. {a:234, b:333, c:"hello"}. Make sure to use " not ' !
	== Optional parameters:
		* 
	**/
	create_iframe_new_video:function(inp){

		console.log(inp);
		console.log("node width:"+inp.target_node.width()+", height:"+inp.target_node.height());
		check=this.check_params(inp, ["target_node", "internal_user_id"])
		if (!check.result){
			throw check.messages.join();
		}
		this.check_auth_token();
		this.check_server_url();
		//get the fubalytics id
		var fubalytics_user=fubalytics.get_user_data(inp.external_user_id);

		var arb_token=encodeURIComponent(inp.arb_token); //JSON.stringify({external_user_id:inp.internal_user_id}));
		var url=this.fubalytics_url+"/api/recordings/new?auth_token="+
			this.auth_token+"&as_user_id="+
			fubalytics_user.id+"&arb_token="+arb_token;

		//process the optional parameters
		
		if ('club1_name' in inp){
			var club1id=this.get_or_create_club(inp.club1_name);
			url=url+"&club_id="+club1id;
		}
		if ('club2_name' in inp){
			var club2id=this.get_or_create_club(inp.club2_name);
			url=url+"&opp_club_id="+club2id;
		}
		if ('game_time' in inp){
			url=url+"&recording_time="+inp.game_time;
		}
		


		console.log(url);

		ifrm = document.createElement("IFRAME"); 
		ifrm.setAttribute("src", url);
			
		ifrm.style.width = "100%";
		ifrm.style.height = "1800px"; //inp.target_node.height()+50;  
		inp.target_node.append(ifrm); 

	},


	/**
	Returns an object containing the check result and 
	all the added messages:
	{result:bool, messages:array of string}
	**/
	check_params:function(obj, req_obj){
		var result=true;
		var messages=new Array();
		for ( var i =0; i<req_obj.length; i++) {
			var is_in=obj.hasOwnProperty(req_obj[i]);
			if (!is_in){
				messages.push("Property is missing:"+req_obj[i]);
			}
			result= result && is_in;
		}
		return {result: result, messages:messages};
	},

	check_auth_token:function(){
		if (this.auth_token==""){
			throw "error.no_authtoken";
		}
	},
	check_server_url:function(){
		if (this.fubalytics_url==""){
			throw "error.no_fubaurl";
		}
	},


	//============ PRIVATE====================================

	/**
	 * Internal method.
	 * Overwrites obj1's values with obj2's and adds obj2's if non existent in obj1
	 * @param obj1
	 * @param obj2
	 * @returns obj3 a new object based on obj1 and obj2
	 */
	merge_options:function(obj1,obj2){
	    var obj3 = {};
	    for (var attrname in obj1) { obj3[attrname] = obj1[attrname]; }
	    for (var attrname in obj2) { obj3[attrname] = obj2[attrname]; }
	    return obj3;
	}
}