//the fubalytics connector requires jQuery.

/*
   Class: fubalytics
   The class, which manages the whole communication with the
   fubalytics server.
   Please see the file views/test.html 
   for reference, where the most of these methods are used in tests.
*/
var fubalytics={
	userid:0,
	fubalytics_url:"",
	auth_token: "",

	/*
	   Function: get_or_create_club
	   Returns the club ID of the passed club name. If the club with
	   the given name does not exist, it is created and then
	   the new ID is returned.

	   Parameters:
	   	name - The name of the club

	   Returns:
	   	The ID of the club with the given name. Note if multiple clubs
	   	with the given name exist, the first of them is returned.
	*/
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

	/*
	Function: setup_new_user
	Creates a new user in the fubalytics system.
	It throws an exception if not all parameters have been provided.
	
	Parameters:
		fubalytics_club_id - The id of the club, IN the fubalytics system
		internal_user_id - the ID of the user in YOUR system. It will be mapped to the user ID in the fubalytics system.
		email -  The email of the user. Is required for payment processes.
		firstname -  (for later payment support)
		lastname -  (for later payment support)
		language - Set the language of the user. supported strings: "de", "en", "pt", "ru", "es"

	Returns:
		The ID of the created user.
	*/
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

	/*
	Function: get_user_data
	This method gets the fubalytics user data as a 
	json object. 
	
	Parameters:
		internal_id - Your internal ID of the user.

	Returns:
		The full user object.
	*/
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

	/*
	Function: get_team_ranks
	Returns all possible team ranks in the fubalytics system. 
	Team ranks are basically numbers: 1,2,3, which represent the rank of a team in a club.
	Returns:
		List of team rank objects.
	*/
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

	/*
	Function: get_team_types
	Returns a list of available team types in the fubalytics
	system. Team types are currently "U13", "U14", ... which represent basically the age of the players in a team.

	Returns:
		List of team type objects.
	*/
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

	/*
	Function: get_event_types
	Returns a list of available team types in the fubalytics
	system. Event types are "league", "friendly", ...
	Please note that the names of the event types are translated
	into the language of the manager user.

	Returns:
		List of event type objects. 
	*/
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
				//console.log(d);
				result=d;
			},
			error:function(d,s,x){
				console.error(d);
				throw "Error on getting the event types: "+d.responseText;
			}

		});
		return result;
	},

	
	/*
	Function: create_players
	Submits multiple new players to the fubalytics system.

	Parameters:
		The format of the object must be e.g.
		> var input={fubalytics_user_id:33, 
		>	players:[{firstname:"Mario", lastname:"Gomez", birthdate:nil, nr:10, position_id:22}, 
		>			{firstname:"Lukas", lastname:"Podolski", birthdate:123456789, nr:11, position_id:21}]};
	*/
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

	/*
	Function: find_player_by_arb_token
	Searches the fubalytics database for a player with the
	given external ID (in your system). 

	Parameters:
		The player must be setup before with a
		suitable arbitrary token. e.g. {external_id:3}.

		arb_token - String. Pass here the token, you would like to search for.
		e.g. 
		> {e2c_id:3}

	Returns:
		A list of all found players matching the given arb. token.
	*/
	find_player_by_arb_token:function(input){
		var result;
		$.ajax({
			url:this.fubalytics_url+"/api/players/find_by_arb_token.json",
			type: "GET",
			async: false,
			data: {query:input,
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


	/*
	Function: delete_player
	Deletes a player from the fubalytics system. 

	Parameters:
		id - The ID of the player in the fubalytics system. See <find_player_by_arb_token> if you 
		need to find it first.

	Returns:
		True if ok, othervise an exception is thrown.
	*/
	delete_player:function(id){
		var result;
		$.ajax({
			url:this.fubalytics_url+"/api/players/"+id+"/destroy_player.json",
			type: "GET",
			async: false,
			data: this.merge_options({auth_token:this.auth_token}, id),
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

	/*
	Function: update_player
	Updates the attrbutes of a player in the fubalytics system. 

	Parameters:
		attributes - object containing following attributes:
			* id - Fubalytics Id of the player to update. See <find_player_by_arb_token> to get it.
			* gender - String "m" or "w" 
			* firstname - string
			* lastname - String
	*/
	update_player:function(attributes){
		check=this.check_params(attributes, ["id"])
		if (!check.result){
			throw check.messages.join();
		}

		var result;
		$.ajax({
			url:this.fubalytics_url+"/api/players/"+attributes.id+"/update_player.json",
			type: "GET",
			async: false,
			data: this.merge_options({auth_token:this.auth_token}, attributes),
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


	/*
	Function: create_iframe_player_profile
	Shows the player profile with its game statistics in a iframe

	Parameters:
		target_node - The dom node, where the IFrame will be placed into
		fubalytics_player_id - The player ID in the fubalytics System. 
		You can get it by using the method find_player_by_arb_token(...).
		input.external_user_id - The ID of the user, in YOUR system.

	*/
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


	

	/*
	Function: create_iframe_videos_index
	Creates an IFrame in the provided node.

	Parameters:
		inp.fubalytics_user_id - The user ID of the user inside the fubalytics system. Use the
		method <get_user_data>(your_user_id) to get it!
		inp.target_node - DOM-Node, where the Iframe should be placed int
	*/
	create_iframe_videos_index:function(inp){
		console.log(inp);
		console.log("node width:"+inp.target_node.width()+", height:"+inp.target_node.height());
		check=this.check_params(inp, ["target_node", "fubalytics_user_id"])
		if (!check.result){
			throw check.messages.join();
		}
		this.check_auth_token();
		this.check_server_url();

		var readonly = (inp.readonly==null ? false : true);

		ifrm = document.createElement("IFRAME"); 
		ifrm.setAttribute("src", this.fubalytics_url+"/api/recordings?auth_token="+this.auth_token+"&as_user_id="+inp.fubalytics_user_id+"&readonly="+readonly); 
		ifrm.style.width = "100%";
		ifrm.style.height = "100%"; //inp.target_node.height()+50;  
		inp.target_node.append(ifrm); 
	},


	/*
	Funcion: create_iframe_new_video
	Sets up an iframe in a given node 
	so the user may upload a new video.

	Parameters:
		Input:
		* taget_node: dom node (e.g. $("mynode") if you use jquery)
		* external_user_id: The user ID of the user inside your system. Use the
		* club1_name
		* club2_name
		* game_time the unix timestamp for the game time
		* arb_token: Object of type e.g. {gamedate_id:342}. It will be stored in the recording so you can find the recording later again
		using your internal gamedate_id. 
		You can pass arbitrary json objects. e.g. {a:234, b:333, c:"hello"}. Make sure to use " not ' !
	*/
	create_iframe_new_video:function(inp){
		console.log(inp);
		console.log("node width:"+inp.target_node.width()+", height:"+inp.target_node.height());
		check=this.check_params(inp, ["target_node", "external_user_id"])
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
		if ('event_type_id' in inp){
			url=url+"&event_type_id="+inp.event_type_id;
		}
		


		console.log(url);

		ifrm = document.createElement("IFRAME"); 
		ifrm.setAttribute("src", url);
			
		ifrm.style.width = "100%";
		ifrm.style.height = "1800px"; //inp.target_node.height()+50;  
		inp.target_node.append(ifrm); 

	},


	/*
	Returns an object containing the check result and 
	all the added messages:
	{result:bool, messages:array of string}
	*/
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

	/*
	Function: find_recording_by_arb_token
	Searches for a recording using the arbitrary token as a query.

	Parameters:
		token - The token. e.g. {e2c_id:3}
	*/
	find_recording_by_arb_token:function(token)
	{
		var result;
		$.ajax({
			url:this.fubalytics_url+"/api/recordings/find_by_arb_token.json",
			type: "GET",
			async: false,
			data: {query:token,
				auth_token:this.auth_token},
			dataType: "json",
			context: document.body,
			success:function(d,s,x){
				result=d;
			},
			error:function(d,s,x){
				console.error(d);
				throw "Error on getting the recordings: "+d.responseText;
			}

		});
		return result;

	},

	/*
	Function: update_recording
	updates the attributes of a recording.
	Please use the example in test.html. The input object is quite nested, so
	its easier to see it on an example.

	Parameters:
		id - The ID of the recording to update. See <find_recording_by_arb_token> about how to get the fubalytics recording ID.
		* event:
			* event_type - Event Type. Eg. Training, League, ...
				* id - Its ID.
			* team - Object describing the first team
				* team_rank:
					* id -  Team rank ID
				* team_type:
					* id -  Team type ID
				* club:
					* id -  Club ID. See <get_or_create_club> about how to get a clubs ID

			* opponent_team - Object describing the second team (if the event type is not a training)
				* team_rank:
					* id
				* team_type:
					* id
				* club:
					* id 

		inp.title -  The title of the recording
		inp.description -  Description
		inp.start_time -  Start time of the recording
		inp.event.score_team_1 - Score of the first team
		inp.event.score_team_2 - Score of the second team
		inp.event_type_id - Type of the event (training, league,...) see <get_event_types> for a list of supported event types.
		inp.arb_token

	*/
	update_recording:function(inp)
	{
		$.ajax({
			url:this.fubalytics_url+"/api/recordings/"+inp.id+".json",
			type: "PUT",
			async: false,
			data: this.merge_options({auth_token:this.auth_token}, inp),
			dataType: "json",
			crossDomain:true,
			context: document.body,
			success:function(d,s,x){
				console.log("fubalytics.update_recording returned: %o", d);
				result=d;
			},
			error:function(d,s,x){
				console.error(d);
				throw "Error on getting the user: "+d.responseText;
			}

		});
		return result;
	},


	/*
	Function: delete_recording
	Deletes the recording and all its videos and tags.

	Parameters: 
		inp.id - ID of the recording in the fubalytics system.
	*/
	delete_recording: function(inp)
	{
		$.ajax({
			url:this.fubalytics_url+"/api/recordings/"+inp.id+".json",
			type: "DELETE",
			async: false,
			data: {auth_token:this.auth_token}, 
			dataType: "json",
			crossDomain:true,
			context: document.body,
			success:function(d,s,x){
				console.log("fubalytics.delete_recording returned: %o", d);
				result=d;
			},
			error:function(d,s,x){
				console.error(d);
				throw "Error on getting the user: "+d.responseText;
			}

		});
		return result;
	},

	/*
	Function: create_recording.
	Creates new recording.

	Parameters:
		inp.id - The ID of the recording to update. See <find_recording_by_arb_token> about how to get the fubalytics recording ID.
		inp.team_1 - Object describing the first team
		* team_rank_id -  Team rank ID
		* team_type_id -  Team type ID
		* club_id -  Club ID. See <get_or_create_club> about how to get a clubs ID

		inp.team_2 - Object describing the second team (if the event type is not a training)
		* team_rank_id
		* team_type_id
		* club_id 

		inp.title -  The title of the recording
		inp.description -  Description
		inp.start_time -  Start time of the recording
		inp.score_team_1 - Score of the first team
		inp.score_team_2 - Score of the second team
		inp.event_type_id - Type of the event (training, league,...) see <get_event_types> for a list of supported event types.
		inp.arb_token - The arbitrary token
	*/
	create_recording:function(inp)
	{
		$.ajax({
			url:this.fubalytics_url+"/api/recordings.json",
			type: "POST",
			async: false,
			data: this.merge_options({auth_token:this.auth_token}, inp),
			dataType: "json",
			crossDomain:true,
			context: document.body,
			success:function(d,s,x){
				console.log("fubalytics.create_recording returned: %o", d);
				result=d;
			},
			error:function(d,s,x){
				console.error(d);
				throw "Error on getting the user: "+d.responseText;
			}

		});
		return result;

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