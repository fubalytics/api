//the fubalytics connector requires jQuery.

/*
   Class: fubalytics
   The class, which manages the whole communication with the
   fubalytics server.
   Please see the file views/test.html 
   for reference, where the most of these methods are used in tests.
*/
var fubalytics={
	//if you do not change these, then the sandbox communication will be used by default.
	userid:0, //the ID of the user in your system
	fubalytics_url:"http://apitest.fubalytics.net:3000",
	//1. get the fubalytics internal ID",
	auth_token: "xxx",
	jq:$,


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
		var nocache = new Date().getTime();
		console.log("Accessing "+this.fubalytics_url+"/api/clubs/get_or_create.json");
		this.jq.ajax({
			url:this.fubalytics_url+"/api/clubs/get_or_create.json",
			type: "GET",
			async: false,
			data: {clubname:name,
				cache:nocache,
				auth_token:this.auth_token},
			dataType: "json",
			context: document.body,
			success:function(d,s,x){
				console.log("received response from clubs/get_or_create: %o", d);
				club_id=d[0].id;
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
	Function: update_user
	Updates some attributes of the user in the fubalytics account.

	Parameters:
		attributes - object containing following attributes:
			* user_id - The ID of the user in the fubalytics system. See <get_user_data> to get the ID by an arb_token.
			* club_id - The ID of the club. See <get_or_create_club> to the the ID.
	*/
	update_user:function(inp){
		check=this.check_params(inp, ["user_id", "club_id"])
		if (!check.result){
			throw "update_user: "+check.messages.join();
		}
		var nocache = new Date().getTime();
		var result;
		this.jq.ajax({
			url:this.fubalytics_url+"/api/users/"+inp.user_id+".json",
			type: "PUT",
			async: false,
			data:{auth_token:this.auth_token, 
				cache: nocache,
				club_id: inp.club_id,
				as_user_id: inp.user_id},
			dataType: "json",
			context: document.body,
			success:function(d,s,x){
				console.log(d);
				result=d;
			},
			error:function(d,s,x){
				console.error(d);
				throw "Error on updating the user: "+d.responseText;
			}

		});
		return result;

	},


	/*
	   Function: create_virtual_user
	   Thhe virtual user mechanism enables the users 
	   of your system to use our remote devices such as the
	   app or the desktop analysis system.
	   Since the users always have to login there, they need to know 
	   the email address stored in our system. This is not guaranteed yet.
	   So you can create a virtual user, which is linked to the account of your
	   user in fubalytics. The user will be able to login with the
	   same email address and the same password in the app.
	   We do not store the password at any time. Only the hashed key.

	   Parameters:
	   	email - The real email of the user
	   	password_hashed - The hashed password of the user in your system. ONly md5 hashes are supported.
	   	user_id: The user ID of the user in the fubalytics system.


	   Returns:
	   	The ID of the virtual user.
	*/
	create_virtual_user:function(inp){
		check=this.check_params(inp, ["email", "password_hashed", "user_id"])
		if (!check.result){
			throw "create_virtual_user: "+check.messages.join();
		}
		this.check_auth_token();
		this.check_server_url();
		vu_id=null;
		console.log("Accessing "+this.fubalytics_url+"/api/virtual_users.json");
		this.jq.ajax({
			url:this.fubalytics_url+"/api/virtual_users.json",
			type: "POST",
			async: false,
			data: {email:inp.email,
				password_hashed:inp.password_hashed,
				as_user_id: inp.user_id,
				auth_token:this.auth_token},
			dataType: "json",
			context: document.body,
			success:function(d,s,x){
				console.log("received response from virtual_users/create: %o", d);
				vu_id=d.id;
				console.log("received virtual user id: "+vu_id);
			},
			error:function(d,s,x){
				console.error(d);
				throw "Error on creating the virtual user: "+d.responseJSON;

			}

		});
		return vu_id;

	},

	/*
	Function: delete_virtual_user
	Deletes a virtual user

	Parameters:
		email: the email or the unique user name of the user
		user_id: The user_id of the acting user (community)

	Returns:
		True if ok, othervise an exception is thrown.
	*/
	delete_virtual_user:function(input){
		check=this.check_params(input, ["email", "user_id"])
		if (!check.result){
			throw "delete_virtual_user: "+check.messages.join();
		}
		var result;
		var nocache = new Date().getTime();
		this.jq.ajax({
			url:this.fubalytics_url+"/api/virtual_users/"+input.email+".json",
			type: "DELETE",
			async: false,
			data:{auth_token:this.auth_token, as_user_id:input.user_id, cache:nocache, email:input.email},
			dataType: "json",
			context: document.body,
			success:function(d,s,x){
				console.log(d);
				result=d;
			},
			error:function(d,s,x){
				console.error(d);
				throw "Error on deleting the virtual user: "+d.responseText;
			}

		});
		return result;

	},

	/*
	Function: setup_new_user
	Creates a new user in the fubalytics system.
	It throws an exception if not all parameters have been provided.
	
	Parameters:
		fubalytics_club_id - The id of the club, IN the fubalytics system
		arb_token - The arbitrary token. e.g. "{e2c_id:23}"
		email -  The email of the user. Is required for payment processes.
		firstname -  (for later payment support)
		lastname -  (for later payment support)
		language - Set the language of the user. supported strings: "de", "en", "pt", "ru", "es"

	Returns:
		The ID of the created user inside the fubalytics system.
	*/
	setup_new_user:function(inp){
		check=this.check_params(inp, ["club_id", "arb_token", "firstname", "lastname", "email", "language"])
		if (!check.result){
			throw "setup_new_user: "+check.messages.join();
		}
		this.check_auth_token();
		this.check_server_url();

		//---------------
		//	create the user with the received club id
		//--------------
		//setup the arbitrary token 
		var arb_token=inp.arb_token; //JSON.stringify({e2c_id:inp.internal_user_id});
		var result;
		var nocache = new Date().getTime();
		this.jq.ajax({
			url:this.fubalytics_url+"/api/users.json",
			type: "POST",
			async: false,
			data: {email:inp.email,
				firstname: inp.firstname, 
				lastname: inp.lastname, 
				club_id: inp.club_id,
				language: inp.language,
				arb_token:arb_token,
				auth_token:this.auth_token,
				cache:nocache},
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
				throw "setup_new_user: Error on creating the new user: "+d.responseText;

			}

		});
		return result;
	},

	/*
	Function: get_user_data
	This method gets the fubalytics user data as a 
	json object. 
	
	Parameters:
		arb_token - The arbitrary token, which is the the key to your user. e.g. "{e2c_id:22}"

	Returns:
		The full user object.
	*/
	get_user_data:function(arb_token){
		var result;
		var nocache = new Date().getTime();
		this.jq.ajax({
			url:this.fubalytics_url+"/api/users/find_by_arb_token.json",
			type: "GET",
			async: false,
			data: {query: arb_token, //
				cache:nocache,
				auth_token:this.auth_token},
			dataType: "json",
			context: document.body,
			success:function(d,s,x){
				console.log(d);
				result=d;
			},
			error:function(d,s,x){
				console.error(d);
				throw d //"Error on getting the user data: "+d.responseText;
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
		var nocache = new Date().getTime();
		this.jq.ajax({
			url:this.fubalytics_url+"/api/team_ranks.json",
			type: "GET",
			async: false,
			data: {auth_token:this.auth_token, cache:nocache},
			dataType: "json",
			context: document.body,
			success:function(d,s,x){
				console.log(d);
				result=d;
			},
			error:function(d,s,x){
				console.error(d);
				throw "Error on getting the team ranks: "+d.responseText;
			}

		});
		return result;
	},



	/*
	Function: get_positions
	Returns all possible player positions. 
	Returns:
		List of team rank objects.
	*/
	get_positions:function(){
		var result;
		var nocache = new Date().getTime();
		this.jq.ajax({
			url:this.fubalytics_url+"/api/positions.json",
			type: "GET",
			async: false,
			data: {auth_token:this.auth_token, cache:nocache},
			dataType: "json",
			context: document.body,
			success:function(d,s,x){
				console.log(d);
				result=d;
			},
			error:function(d,s,x){
				console.error(d);
				throw "Error on getting the positions: "+d.responseText;
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
		var nocache = new Date().getTime();
		this.jq.ajax({
			url:this.fubalytics_url+"/api/team_types.json",
			type: "GET",
			async: false,
			data: {auth_token:this.auth_token, cache:nocache},
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
		var nocache = new Date().getTime();
		this.jq.ajax({
			url:this.fubalytics_url+"/api/event_types.json",
			type: "GET",
			async: false,
			data: {auth_token:this.auth_token, cache:nocache},
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
		club_id - ID of the club INSIDE fubalytics
		team_rank_id - ID of the team rank (e.g "1.") INSIDE fubalytics
		team_type_id - ID of the team type inside fubalytics
		fubalytics_user_id - ID of the fubalytics user, who is creating the player.
		players: array of players.
		The format of the players must be e.g.
		>	players:[{firstname:"Mario", lastname:"Gomez", birthdate:nil, nr:10, 
		>      position_id:22, arb_token:"{e2c_id:44}", icon_url: "http://server/image.png"}, 
		>			{firstname:"Lukas", lastname:"Podolski", birthdate:123456789, 
		>     nr:11, position_id:21, arb_token:"{e2c_id:44}", icon_url: "http://server/image.png"}]};
	*/
	create_players:function(input){
		var result;
		check=this.check_params(input, ["club_id", "team_rank_id", "team_type_id", "fubalytics_user_id"])
		if (!check.result){
			throw "On Creating players: "+check.messages.join();
		}
		var nocache = new Date().getTime();
		this.jq.ajax({
			url:this.fubalytics_url+"/api/players/batch_create_e2c.json",
			type: "POST",
			async: false,
			data: this.merge_options({auth_token:this.auth_token, cache:nocache}, input),
			dataType: "json",
			context: document.body,
			success:function(d,s,x){
				console.log(d);
				result=d;
			},
			error:function(d,s,x){
				console.error(d);
				throw "Error on creating the players: "+d.responseText;
			}

		});
		return result;
	},

	/*
	Function: find_players_by_arb_token
	Searches the fubalytics database for a player with the
	given external ID (in your system). 

	Parameters:
	  The player must be setup before with a suitable arbitrary token. 
	  e.g. {external_id:3}.

		* arb_token - String. Pass here the token, you would like to search for.
		e.g. {e2c_id:3}
		* user_id: The ID of the fubalytics user, who is asking for his/her players.

	Returns:
		A list of all found players matching the given arb. token and the user ID.
	*/
	find_players_by_arb_token:function(input){
		check=this.check_params(input, ["arb_token", "user_id"])
		if (!check.result){
			throw "find_players_by_arb_token: "+check.messages.join();
		}

		var result;
		var nocache = new Date().getTime();
		this.jq.ajax({
			url:this.fubalytics_url+"/api/players/find_by_arb_token.json",
			type: "GET",
			async: false,
			data: {query:input.arb_token,
				as_user_id:input.user_id,
				auth_token:this.auth_token,
			  cache:nocache},
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
		id - The ID of the player in the fubalytics system. See <find_players_by_arb_token> if you 
		need to find it first.
		user_id: The ID of the user, who owns the playedr record

	Returns:
		True if ok, othervise an exception is thrown.
	*/
	delete_player:function(input){
		check=this.check_params(input, ["id", "user_id"])
		if (!check.result){
			throw "delete_player: "+check.messages.join();
		}
		var result;
		var nocache = new Date().getTime();
		this.jq.ajax({
			url:this.fubalytics_url+"/api/players/"+input.id+".json",
			type: "DELETE",
			async: false,
			data:{auth_token:this.auth_token, as_user_id:input.user_id, cache:nocache},
			dataType: "json",
			context: document.body,
			success:function(d,s,x){
				console.log(d);
				result=d;
			},
			error:function(d,s,x){
				console.error(d);
				throw "Error on deleting the player: "+d.responseText;
			}

		});
		return result;

	},

	/*
	
	Function: get_player_statistics
	This function reads the tag statistics of a player.

	Parameters:
		id - The ID of the player in the fubalytics system. See <find_players_by_arb_token> if you 
		need to find it first.
		user_id: The ID of the user, who owns the playedr record

	Returns:
		An array of tag list object.
	*/

	get_player_statistics:function(input){
		check=this.check_params(input, ["id", "user_id"])
		if (!check.result){
			throw "get_player_statistics: "+check.messages.join();
		}
		var result;
		var nocache = new Date().getTime();
		this.jq.ajax({
			url:this.fubalytics_url+"/api/players/"+input.id+"/statistics.json",
			type: "GET",
			async: false,
			data:{auth_token:this.auth_token, as_user_id:input.user_id, cache:nocache},
			dataType: "json",
			context: document.body,
			success:function(d,s,x){
				console.log(d);
				result=d;
			},
			error:function(d,s,x){
				console.error(d);
				throw "Error with getting player statistics: "+d.responseText;
			}

		});
		console.log("Returned value of get_player_statistics :" + result);
		return result;

	},


	/**
	Function: update_all_clubs
	When you would like to update the club reference of ALL the player at once,
	you can call this method. All players in the account of the user with ID=user_id
	will be set to the club referenced by the passed club_id.

	Parameters in input:
		club_id - The ID of the club in the fubalytics system
		user_id - The ID of the user in the fubalytics system. See <get_user_data>.
		**/

	update_all_clubs:function(input){
		check=this.check_params(input, ["club_id", "user_id"])
		if (!check.result){
			throw "update_all_clubs: "+check.messages.join();
		}
		var result;
		var nocache = new Date().getTime();
		this.jq.ajax({
			url:this.fubalytics_url+"/api/users/"+input.user_id+"/update_all_clubs.json",
			type: "GET",
			async: false,
			data:{auth_token:this.auth_token, as_user_id:input.user_id, cache:nocache, club_id:input.club_id},
			dataType: "json",
			context: document.body,
			success:function(d,s,x){
				console.log(d);
				result=d;
			},
			error:function(d,s,x){
				console.error(d);
				throw "Error while updating clubs: "+d.responseText;
			}

		});
		console.log("Succesfully updated all the data!");
		return result;

	},


	/*
	Function: update_player
	Updates the attrbutes of a player in the fubalytics system. 

	Parameters:
		attributes - object containing following attributes:
			* id - Fubalytics Id of the player to update. See <find_players_by_arb_token> to get it.
			* as_user_id: Fubalytics Id of the user, who owns the player record.
			* gender - String "m" or "w" 
			* firstname - string
			* lastname - String
			* icon_url - The URL of the icon of the player. if not passed, the old one is NOT updated
			* date_of_birth - Unix time stamp for the date of birth of the player
	*/
	update_player:function(attributes){
		check=this.check_params(attributes, ["id"])
		if (!check.result){
			throw "update_player: "+check.messages.join();
		}
		var nocache = new Date().getTime();
		var result;
		this.jq.ajax({
			url:this.fubalytics_url+"/api/players/"+attributes.id+".json",
			type: "PUT",
			async: false,
			data: this.merge_options({auth_token:this.auth_token, cache:nocache}, attributes),
			dataType: "json",
			context: document.body,
			success:function(d,s,x){
				console.log(d);
				result=d;
			},
			error:function(d,s,x){
				console.error(d);
				throw "Error on updating the player: "+d.responseText;
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
		You can get it by using the method find_players_by_arb_token(...).
		input.external_user_id - The ID of the user, in YOUR system.
		user_arb_token: The arbitrary token of the user, who is calling for the player profile. e.g. "{e2c_id:22}"

	*/
	create_iframe_player_profile:function(input){
		console.log(input);
		check=this.check_params(input, ["target_node", "fubalytics_player_id", "external_user_id"])
		if (!check.result){
			throw check.messages.join();
		}
		this.check_auth_token();
		this.check_server_url();

		var fubalytics_user=fubalytics.get_user_data(input.user_arb_token);

		ifrm = document.createElement("IFRAME"); 
		ifrm.setAttribute("src", this.fubalytics_url+"/api/players/"+input.fubalytics_player_id+
			"?auth_token="+this.auth_token+"&as_user_id="+fubalytics_user.id); 
		ifrm.setAttribute("allowfullscreen", true);
		ifrm.setAttribute("webkitallowfullscreen", true);
		ifrm.setAttribute("mozallowfullscreen", true);
		ifrm.style.width = "100%";
		ifrm.style.height = "100%"; //inp.target_node.height()+50;  
		input.target_node.append(ifrm); 

	},

	/*
	Function: create_iframe_player_statistics
	Shows the player's statistics

	Parameters:
		target_node - The dom node, where the IFrame will be placed into
		fubalytics_player_id - The player ID in the fubalytics System. 
		You can get it by using the method find_players_by_arb_token(...).
		input.external_user_id - The ID of the user, in YOUR system.
		user_arb_token: The arbitrary token of the user, who is calling for the player profile. e.g. "{e2c_id:22}"

	*/

	create_iframe_player_statistics:function(input)
	{
		console.log(input);
		check=this.check_params(input, ["target_node", "user_arb_token", "fubalytics_player_id"])
		if (!check.result){
			throw check.messages.join();
		}
		this.check_auth_token();
		this.check_server_url();

		var fubalytics_user=fubalytics.get_user_data(input.user_arb_token);

		ifrm = document.createElement("IFRAME"); 
		ifrm.setAttribute("src", this.fubalytics_url+"/api/players/"+input.fubalytics_player_id+
			"/statistics?auth_token="+this.auth_token+"&as_user_id="+fubalytics_user.id); 
		ifrm.setAttribute("allowfullscreen", true);
		ifrm.setAttribute("webkitallowfullscreen", true);
		ifrm.setAttribute("mozallowfullscreen", true);
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
		inp.public: if true, only public videos are displayed
		inp.readonly: if true, the video cannot be edited.
		inp.referrer: Set this value to the page, which is showing the Iframe.
			This is necessary for Safari Browsers, which are still pain in the a** with Iframes.
			For details, see this discussion here:http://stackoverflow.com/questions/9930671/safari-3rd-party-cookie-iframe-trick-no-longer-working
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

		var readonly = (inp.readonly==null ? false : inp.readonly);
		var is_public = (inp.public==null ? false : is_public);
		var referrer= (inp.referrer==null ? "" : inp.referrer); 

		ifrm = document.createElement("IFRAME"); 
		//ifrm.setAttribute("allowfullscreen",null);
		ifrm.setAttribute("allowfullscreen", true);

		ifrm.setAttribute("src", this.fubalytics_url+"/api/recordings?auth_token="+this.auth_token+
			"&as_user_id="+inp.fubalytics_user_id+
			"&readonly="+readonly+
			"&public="+is_public+
			"&referrer="+referrer); 
		
		//check if IE
		if (document.msFullscreenEnabled!=null)
		{
			//IE detected
			//$(ifrm).attr("allowfullscreen", '');

			if (document.msFullscreenEnabled==null) //check if the IE browser version is >=11
			{
				console.error("!!!!!!!!!  OLD VERSION OF IE DETECTED. IT DOES NOT SUPPORT FULL SCREEN in IFRAMES!");
			}
		}
		
		
		ifrm.setAttribute("webkitallowfullscreen", true);
		ifrm.setAttribute("mozallowfullscreen", true);
		ifrm.setAttribute("webkit-overflow-scrolling","touch");

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
		* taget_node: dom node (e.g. this.jq("mynode") if you use jquery)
		* user_arb_token: The arb token of the user, who is calling the iframe. e.g. "{e2c_id:22}"
		* club1_name
		* club2_name
		* recording_time the unix timestamp for the game time
		* inp.referrer: Set this value to the page, which is showing the Iframe.
			This is necessary for Safari Browsers, which are still pain in the a** with Iframes.
			For details, see this discussion here:http://stackoverflow.com/questions/9930671/safari-3rd-party-cookie-iframe-trick-no-longer-working

		* game_arb_token: Object of type e.g. {gamedate_id:342}. It will be stored in the recording so you can find the recording later again
		using your internal gamedate_id. 
		You can pass arbitrary json objects. e.g. {a:234, b:333, c:"hello"}. Make sure to use " not ' !
	*/
	create_iframe_new_video:function(inp){
		console.log(inp);
		console.log("node width:"+inp.target_node.width()+", height:"+inp.target_node.height());
		check=this.check_params(inp, ["target_node", "user_arb_token"])
		if (!check.result){
			throw check.messages.join();
		}
		this.check_auth_token();
		this.check_server_url();
		//get the fubalytics id
		var fubalytics_user=fubalytics.get_user_data(inp.user_arb_token);
		var referrer= (inp.referrer==null ? "" : inp.referrer); 
		var game_arb_token=encodeURIComponent(inp.game_arb_token); //JSON.stringify({external_user_id:inp.internal_user_id}));
		var url=this.fubalytics_url+"/recordings/new?auth_token="+
			this.auth_token+"&as_user_id="+
			fubalytics_user.id+"&arb_token="+game_arb_token+
			"&referrer="+referrer;

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
		ifrm.setAttribute("allowfullscreen", true);
		ifrm.setAttribute("webkitallowfullscreen", true);
		ifrm.setAttribute("mozallowfullscreen", true);
			
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
	Returns: An array of all found recordings. To get the ID of the recording, you cann call
	result[0].id
	*/
	find_recordings_by_arb_token:function(token)
	{
		var result;
		this.jq.ajax({
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
		inp.event.score_team1 - Score of the first team
		inp.event.score_team2 - Score of the second team
		inp.event_type_id - Type of the event (training, league,...) see <get_event_types> for a list of supported event types.
		inp.arb_token

	*/
	update_recording:function(inp)
	{
		this.jq.ajax({
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
				throw "Error on updating the recording: "+d.responseText;
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
		this.jq.ajax({
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
				throw "Error on deleting the recording: "+d.responseText;
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
		inp.score_team1 - Score of the first team
		inp.score_team2 - Score of the second team
		inp.event_type_id - Type of the event (training, league,...) see <get_event_types> for a list of supported event types.
		inp.arb_token - The arbitrary token
	*/
	create_recording:function(inp)
	{
		this.jq.ajax({
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
				throw "Error on creating the recording: "+d.responseText;
			}

		});
		return result;

	},

	/* Function: reads all the team assignments for a given player.
	Pass a player id in the fubalytics system as input.
	Parameters:
		inp.player_id: Id of the player in the fubalytics system. Use <find_players_by_arb_token> how to get it.
		inp.user_id: Id of the user, who is managing the player.
	*/
	get_team_assignments_by_player:function(inp)
	{
		this.jq.ajax({
			url:this.fubalytics_url+"/api/team_assignments/by_player.json",
			type: "GET",
			async: false,
			data: this.merge_options({auth_token:this.auth_token, as_user_id:inp.user_id}, inp),
			dataType: "json",
			crossDomain:true,
			context: document.body,
			success:function(d,s,x){
				console.log("fubalytics.get_team_assignments_by_player returned: %o", d);
				result=d;
			},
			error:function(d,s,x){
				console.error(d);
				throw "Error on get_team_assignments_by_player: "+d.responseText;
			}

		});
		return result;
	},

	/* Function: Create a new team assignment for a player.
	Parameters:
		inp.user_id: The ID of the user, who manages the player. 
		inp.player_id: The ID of the player
		inp.team_rank_id: Optional
		inp.team_type_id: Optional
		inp.club_id: The ID of the club
		inp.date_from: Unix time of the start of the contract
		inp.date_until: Unix time of the end of the contract.
		inp.position_id: The ID of the field position.
		inp.nr: The number of the player in team
		inp.user_id: The user ID, who manages the player.
	*/
	create_team_assignment:function(inp)
	{
		this.jq.ajax({
			url:this.fubalytics_url+"/api/team_assignments.json",
			type: "POST",
			async: false,
			data: this.merge_options({auth_token:this.auth_token, as_user_id: inp.user_id}, inp),
			dataType: "json",
			crossDomain:true,
			context: document.body,
			success:function(d,s,x){
				console.log("fubalytics.create_team_assignment returned: %o", d);
				result=d;
			},
			error:function(d,s,x){
				console.error(d);
				throw "Error on create_team_assignment: "+d.responseText;
			}

		});
		return result;
	},


	/*
	Function: Update the team assignments data like valid from, until, position
	Parameters:
		inp.id: The ID of the team assignment. See <get_team_assignments_by_player> to get it.
		inp.player_id: The ID of the player inside the fubalytics system. See <find_players_by_arb_token> to get it.
		inp.position_id: The Position ID of the player in the team. See <get_positions> for details or issue #2052
		inp.nr: The number of the player in the assignment. e.g 10.
		inp.user_id: The ID of the fubalytics user who manages the player.
		inp.date_from: Start date
		inp.date_until: End date of the contract
	*/
	update_team_assignment:function(inp)
	{
		this.jq.ajax({
			url:this.fubalytics_url+"/api/team_assignments/"+inp.id+".json",
			type: "PUT",
			async: false,
			data: this.merge_options({auth_token:this.auth_token, as_user_id:inp.user_id}, inp),
			dataType: "json",
			crossDomain:true,
			context: document.body,
			success:function(d,s,x){
				console.log("fubalytics.update_team_assignment returned: %o", d);
				result=d;
			},
			error:function(d,s,x){
				console.error(d);
				throw "Error on update_team_assignment: "+d.responseText;
			}

		});
		return result;
	},

	/* Function: Delete a team assignment.
	Parameters:
		inp.id: The ID of the team assignment. See <get_team_assignments_by_player> to get it.
		inp.user_id: The user ID who manages the player.
	*/
	delete_team_assignment:function(inp)
	{
		this.jq.ajax({
			url:this.fubalytics_url+"/api/team_assignments/"+inp.id+".json",
			type: "DELETE",
			async: false,
			data: this.merge_options({auth_token:this.auth_token, as_user_id:inp.user_id}, inp),
			dataType: "json",
			crossDomain:true,
			context: document.body,
			success:function(d,s,x){
				console.log("fubalytics.delete_team_assignment returned: %o", d);
				result=d;
			},
			error:function(d,s,x){
				console.error(d);
				throw "Error on delete_team_assignment: "+d.responseText;
			}

		});
		return result;
	},


	/* Function: returns all the positions in the system.
	*/
	get_positions:function()
	{
		this.jq.ajax({
			url:this.fubalytics_url+"/api/positions.json",
			type: "GET",
			async: false,
			data: {auth_token:this.auth_token},
			dataType: "json",
			crossDomain:true,
			context: document.body,
			success:function(d,s,x){
				console.log("fubalytics.get_positions returned: %o", d);
				result=d;
			},
			error:function(d,s,x){
				console.error(d);
				throw "Error on get_positions: "+d.responseText;
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
