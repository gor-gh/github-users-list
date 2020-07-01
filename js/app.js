class MainView extends React.Component{
    state = {
        openList: true,
        currentUser: null,
        foundedUser: null,
        usersList: [],
        isLoading: false
    }
    componentDidMount(){
        this.fetchUsersList();
    }
    fetchUsersList = () => {
        fetch('https://api.github.com/users')
            .then(res => res.json())
            .then(users => {
                this.setState({usersList: users});
            })
    }
    handleUserClick = (userId) => {
        const user = this.state.usersList.find(user => user.node_id === userId);
        this.openUserProfile(user);
    }
    handleLoginClick = (user) => {
        this.openUserProfile(user);
    }
    handleFormSubmit = (newData) => {
        this.setState({isLoading: true},() => {
            this.setState({
                usersList: this.state.usersList.map(user => {
                    if(user.node_id === newData.node_id){
                        const newUser = Object.assign({}, user, {
                            login: newData.login,
                            avatar_url: newData.avatarUrl
                        })
                        return newUser
                    }
                    return user;
                })
            },() => {
                this.setState({isLoading: false});
            })
        })
    }
    handleUserDelete = (id) => {
        this.setState({
            usersList: this.state.usersList.filter(user => user.node_id !== id)
        })
    }
    handleLogoClick = () => {
        this.openListPage();
    }
    handleSearch = (input) => {
        this.setState({
            foundedUser: this.state.usersList.find(user => user.login === input)
        })
    }
    openUserProfile = (user) => {
        this.setState({openList: false,currentUser: user});
        this.forceUpdate();
    }
    openListPage = () => {
        this.setState({openList: true,currentUserId: null});
    }
    render(){
        return (
            <div className='myElement'>
                <Header
                    onLogoClick={this.handleLogoClick}
                    foundedUser={this.state.foundedUser}
                    onSearch={this.handleSearch}
                    onLoginClick={this.handleLoginClick}
                />
                <ContentSection
                    users={this.state.usersList}
                    isLoading={this.state.isLoading}
                    currentUser={this.state.currentUser}
                    onUserClick={this.handleUserClick}
                    onFormSubmit={this.handleFormSubmit}
                    onUserDelete={this.handleUserDelete}
                    openList={this.state.openList}
                />
            </div>
        )
    }
}
class Header extends React.Component{
    state = {
        width: '207px',
        searchText: ''
    }
    expandInput = () => {
        this.setState({width: '350px'})
    }
    minimizeInput = () => {
        this.setState({width: '207px'});
    }
    handleChange = (e) => {
        this.setState({searchText: e.target.value},() => {
            this.props.onSearch(this.state.searchText);
        })
    }
    handleLoginClick = () => {
        this.props.onLoginClick(this.props.foundedUser);
        this.setState({searchText: ''},() => {
            this.props.onSearch(this.state.searchText);
        })
    }
    render(){
        return (
            <header className='container-fluid d-flex justify-content-between'>
                <div
                    onClick={this.props.onLogoClick}
                    className='back_to_element p-4 d-flex align-items-center'
                >
                    <h3 className='mb-0'>
                        <img src="./images/GitHub-Mark-Light-32px.png" alt="no photo" className='float-left'/>
                        &nbsp; Users List
                    </h3>
                </div>
                <div className='search_panel d-flex align-items-center'>
                    <input
                        style={{width: this.state.width}}
                        onFocus={this.expandInput}
                        onBlur={this.minimizeInput}
                        onChange={this.handleChange}
                        value={this.state.searchText}
                        type="search"
                        name="login"
                        id="login"
                        placeholder='Search or jump to...'
                        autoComplete='off'
                    />
                    <div className='search_result' style={{display: this.props.foundedUser   ? 'block' : 'none'}}>
                        {
                            this.props.foundedUser ?
                                <div
                                    className='search_item d-flex justify-content-center align-items-center'
                                    onClick={this.handleLoginClick}>
                                    <img src={this.props.foundedUser.avatar_url} className='rounded-circle mr-2' alt=""/>
                                    {this.props.foundedUser.login}
                                </div>
                                :
                                ''
                        }
                    </div>
                </div>
            </header>
        )
    }
}

class ContentSection extends React.Component{

    render(){
        const renderElement = this.props.openList ?
            (<UsersList
                onUserClick={this.props.onUserClick}
                isLoading={this.props.isLoading}
                users={this.props.users}
                onFormSubmit={this.props.onFormSubmit}
                onUserDelete={this.props.onUserDelete}
            />)
            :
            (<UserProfile
                currentUser={this.props.currentUser}
            />);
        return (
            <div className="container-fluid px-3 d-flex justify-content-center">
                {renderElement}
            </div>
        )
    }
}

class UserProfile extends React.Component{
    state = {
        currentUserData: {
            login: this.props.currentUser.login
        }
    }
    componentDidMount(){
        const {currentUser} = this.props;

        const followersUrl = currentUser.followers_url;
        const followingUrl = currentUser.following_url.slice(0,currentUser.following_url.indexOf("{"));
        const starredUrl = currentUser.starred_url.slice(0,currentUser.starred_url.indexOf("{"));
        const reposUrl = currentUser.repos_url;

        const arr = [
            fetch(followersUrl).then(res => res.json()).then(data => data.length),
            fetch(followingUrl).then(res => res.json()).then(data => data.length),
            fetch(starredUrl).then(res => res.json()).then(data => data.length),
            fetch(reposUrl).then(res => res.json()).then(data => data)
        ];

        Promise.mapSeries(arr, res => res).then(results => {
            this.setState({
                currentUserData: {
                    nodeId: currentUser.node_id,
                    login: currentUser.login,
                    avatarUrl: currentUser.avatar_url,
                    followersCount: results[0],
                    followingCount: results[1],
                    starredCount: results[2],
                    repos: results[3]
                }
            })
        });

    }

    render(){
        if(this.state.currentUserData.login &&
            this.state.currentUserData.followersCount &&
            this.state.currentUserData.followingCount &&
            this.state.currentUserData.starredCount &&
            this.state.currentUserData.repos
        ){
            const {login,avatarUrl, followersCount, followingCount, starredCount, repos} = this.state.currentUserData;
            return (
                <div className='container row pt-4'>
                    <div className="col-lg-4">
                        <div className='d-flex justify-content-center'>
                            <img src={avatarUrl} className='profile_pic' alt="Not Found"/>
                        </div>
                        <h1 className='text-center'>
                            {login}
                        </h1>
                        <div className='d-flex justify-content-around'>
                            <span>
                                <svg width="1.3em" height="1.3em" viewBox="0 0 16 16" className="bi bi-people"
                                     fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                                    <path fillRule="evenodd"
                                        d="M15 14s1 0 1-1-1-4-5-4-5 3-5 4 1 1 1 1h8zm-7.995-.944v-.002.002zM7.022 13h7.956a.274.274 0 0 0 .014-.002l.008-.002c-.002-.264-.167-1.03-.76-1.72C13.688 10.629 12.718 10 11 10c-1.717 0-2.687.63-3.24 1.276-.593.69-.759 1.457-.76 1.72a1.05 1.05 0 0 0 .022.004zm7.973.056v-.002.002zM11 7a2 2 0 1 0 0-4 2 2 0 0 0 0 4zm3-2a3 3 0 1 1-6 0 3 3 0 0 1 6 0zM6.936 9.28a5.88 5.88 0 0 0-1.23-.247A7.35 7.35 0 0 0 5 9c-4 0-5 3-5 4 0 .667.333 1 1 1h4.216A2.238 2.238 0 0 1 5 13c0-1.01.377-2.042 1.09-2.904.243-.294.526-.569.846-.816zM4.92 10c-1.668.02-2.615.64-3.16 1.276C1.163 11.97 1 12.739 1 13h3c0-1.045.323-2.086.92-3zM1.5 5.5a3 3 0 1 1 6 0 3 3 0 0 1-6 0zm3-2a2 2 0 1 0 0 4 2 2 0 0 0 0-4z"/>
                                </svg> &nbsp;
                                {followersCount} followers &bull;
                            </span>
                            <span>
                                {followingCount} following &bull;
                            </span>
                            <span>
                                <svg width="1.3em" height="1.3em" viewBox="0 0 16 16" className="bi bi-star"
                                     fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                                    <path fillRule="evenodd"
                                        d="M2.866 14.85c-.078.444.36.791.746.593l4.39-2.256 4.389 2.256c.386.198.824-.149.746-.592l-.83-4.73 3.523-3.356c.329-.314.158-.888-.283-.95l-4.898-.696L8.465.792a.513.513 0 0 0-.927 0L5.354 5.12l-4.898.696c-.441.062-.612.636-.283.95l3.523 3.356-.83 4.73zm4.905-2.767l-3.686 1.894.694-3.957a.565.565 0 0 0-.163-.505L1.71 6.745l4.052-.576a.525.525 0 0 0 .393-.288l1.847-3.658 1.846 3.658a.525.525 0 0 0 .393.288l4.052.575-2.906 2.77a.564.564 0 0 0-.163.506l.694 3.957-3.686-1.894a.503.503 0 0 0-.461 0z"/>
                                    </svg> &nbsp;
                                {starredCount}
                            </span>
                        </div>

                    </div>
                    <div className="col-lg-8">
                        <ReposList repos={repos}/>
                    </div>
                </div>
            )
        } else {
            return (
                (<LoadingAnimation />)
            )
        }
        // return (
        //     <h1>{this.props.currentUser.login}</h1>
        // )
    }
}
const ReposList = (props) => {
    const languageIcons = {
        'HTML': '#e34c26',
        'CSS': '#563d7c',
        'JavaScript': '#f1e05a',
        'Ruby': '#701516',
        'Perl': '#0298c3',
        'Go': '#00ADD8',
        'Erlang': '#B83998',
        'R': '#198CE7',
        'TypeScript': '#2b7489',
        'C': '#555555',
        'C#': '#178600',
        'Objective-C': '#438eff',
        'Python': '#3572A5',
        'C++': '#f34b7d',
        'PowerShell': '#012456',
        'Java': '#b07219',
        'Shell': '#89e051',
        'Rust': '#dea584'
    }
    return (
        <div className='container repos_cont pt-4 pb-4'>
            <h1 className='text-center pb-2'>Repositories</h1>
            {props.repos.map(repo => (
                    <Repo
                        key={repo.node_id}
                        fullName={repo.full_name}
                        url={repo.html_url}
                        description={repo.description}
                        language={repo.language}
                        langColor={repo.language in languageIcons ? languageIcons[repo.language] : '#24292e'}
                    />
                )
            )}
        </div>
    )
}

const Repo = (props) => {
    return (
        <div className='container repo'>
            <div>
                <h2 className='repo_name'><a href={props.url}>{props.fullName}</a></h2>
            </div>
            <div className='pl-3 repo_descr'>
                <h6>{props.description}</h6>
            </div>
            {
                props.language ? (
                    <div className='d-flex align-items-center'>
                        <div style={{backgroundColor: props.langColor}} className='language_badge'></div>
                        <span className='pl-2'>{props.language}</span>
                    </div>
                ) : ''
            }
        </div>
    )
}

const LoadingAnimation = (props) => {
    return (
        <div className='text-center'>

            <div className='animation_element mx-0'>
                <div></div>
                <div></div>
            </div>

        </div>
    )
}



class UsersList extends React.Component{


    render(){

        return (
            <div className='container user_list pt-3 pb-4 '>
                <h1 className='text-center'>- Users List -</h1>
                {
                    this.props.users.map((user,index,arr) => (
                        <UserListItem
                            key={'user' + user.id}
                            isLast={index === arr.length - 1}
                            id={user.node_id}
                            imgUrl={user.avatar_url}
                            pageUrl={user.html_url}
                            login={user.login}
                            isLoading={this.props.isLoading}
                            onFormSubmit={this.props.onFormSubmit}
                            onUserDelete={this.props.onUserDelete}
                            onUserClick={this.props.onUserClick}
                        />
                    ))
                }
            </div>
        );
    }
}

class UserListItem extends React.Component{
    state = {
        editFormOpen: false
    }

    handleEditFormOpen = () => {
        this.setState({editFormOpen: true});
    }
    handleFormClose = () => {
        this.setState({editFormOpen : false});
    }
    handleUserDelete = (id) => {
        this.props.onUserDelete(this.props.id);
    }
    handleUserClick = () => {
        this.props.onUserClick(this.props.id);
    }
    render() {
        return (
            <div className={`user_list_item_container p-2 ${this.props.isLast ? 'border_bottom_only' : ''}`}>
                <div className='d-flex w-100 justify-content-between px-3'>
                    <span
                        onClick={this.handleUserClick}
                        className='d-flex align-items-center cursor_pointer'>
                        <img src={this.props.imgUrl} alt="Not Found" className='float-left rounded-circle avatar ml-2'/>
                        <button
                            className='btn user_login ml-1'

                        >{this.props.login}</button>
                    </span>
                    {
                        this.props.isAdmin ? <span className='badge badge-warning'>admin</span> : ''
                    }
                    <div>
                        <button className='btn' title="Edit user info." onClick={this.handleEditFormOpen}>
                            <svg width="0.9em" height="1em" viewBox="0 0 16 16" className="bi bi-pencil-square"
                                 fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                                <path
                                    d="M15.502 1.94a.5.5 0 0 1 0 .706L14.459 3.69l-2-2L13.502.646a.5.5 0 0 1 .707 0l1.293 1.293zm-1.75 2.456l-2-2L4.939 9.21a.5.5 0 0 0-.121.196l-.805 2.414a.25.25 0 0 0 .316.316l2.414-.805a.5.5 0 0 0 .196-.12l6.813-6.814z"/>
                                <path fillRule="evenodd"
                                      d="M1 13.5A1.5 1.5 0 0 0 2.5 15h11a1.5 1.5 0 0 0 1.5-1.5v-6a.5.5 0 0 0-1 0v6a.5.5 0 0 1-.5.5h-11a.5.5 0 0 1-.5-.5v-11a.5.5 0 0 1 .5-.5H9a.5.5 0 0 0 0-1H2.5A1.5 1.5 0 0 0 1 2.5v11z"/>
                            </svg>
                        </button>
                        <button className='btn' title='Delete user.' onClick={this.handleUserDelete}>
                            <svg width="0.9em" height="1em" viewBox="0 0 16 16" className="bi bi-trash-fill"
                                 fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                                <path fillRule="evenodd"
                                      d="M2.5 1a1 1 0 0 0-1 1v1a1 1 0 0 0 1 1H3v9a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2V4h.5a1 1 0 0 0 1-1V2a1 1 0 0 0-1-1H10a1 1 0 0 0-1-1H7a1 1 0 0 0-1 1H2.5zm3 4a.5.5 0 0 1 .5.5v7a.5.5 0 0 1-1 0v-7a.5.5 0 0 1 .5-.5zM8 5a.5.5 0 0 1 .5.5v7a.5.5 0 0 1-1 0v-7A.5.5 0 0 1 8 5zm3 .5a.5.5 0 0 0-1 0v7a.5.5 0 0 0 1 0v-7z"/>
                            </svg>
                        </button>
                    </div>
                </div>
                {
                    this.state.editFormOpen ?
                        <UserEditForm
                            id={this.props.id}
                            isLoading={this.props.isLoading}
                            onFormSubmit={this.props.onFormSubmit}
                            onFormCancel={this.handleFormCancel}
                            onFormClose={this.handleFormClose}
                            login={this.props.login}
                            avatarUrl={this.props.imgUrl}

                        /> : ''
                }


            </div>
        )
    }
}

class UserEditForm extends React.Component{
    state = {
        login: this.props.login,
        avatarUrl: this.props.avatarUrl
    }
    handleFormSubmit = () => {
        const newData = {
            node_id: this.props.id,
            login: this.state.login,
            avatarUrl: this.state.avatarUrl
        }
        this.props.onFormSubmit(newData);
        this.closeForm();
    }
    handleStateChange = (e) => {
        this.setState({
            [e.target.name] : e.target.value
        })
    }
    closeForm = () => {
        this.props.onFormClose();
    }
    render(){
        return (
            <div className='d-flex justify-content-center'>
                <div className="edit_window w-75 p-4" >
                    <div className='row d-flex align-items-center mb-4'>
                        <div className='col-sm-4 text-center'>
                            <label htmlFor={'login' + this.props.id} className='d-block m-0'>Login:</label>
                        </div>
                        <div className="col-sm-8">
                            <input
                                type="text"
                                className='w-100 p-1'
                                name='login'
                                id={'login' + this.props.id}
                                value={this.state.login}
                                onChange={this.handleStateChange}
                            />
                        </div>

                    </div>
                    <div className='row d-flex align-items-center mb-4'>
                        <div className='col-sm-4 text-center'>
                            <label htmlFor={"avatarUrl" + this.props.id} className='d-block m-0' >Avatar URL:</label>
                        </div>
                        <div className="col-sm-8">
                            <input
                                type="text"
                                className='w-100 p-1'
                                name="avatarUrl"
                                id={"avatarUrl" + this.props.id}
                                value={this.state.avatarUrl}
                                onChange={this.handleStateChange}
                            />
                        </div>

                    </div>

                    <div className='d-flex justify-content-around px-5'>
                        <button
                            className={`btn submit_btn px-4 text-white ${this.props.isLoading ? 'disabled' : ''}`}
                            onClick={this.handleFormSubmit}>Update</button>
                        <button
                            className='btn btn-danger px-4'
                            onClick={this.closeForm}
                        >Cancel</button>
                    </div>
                </div>
            </div>

        )
    }
}


ReactDOM.render(
    <MainView/>,
    document.getElementById('root')
);