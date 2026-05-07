module.exports = {
    users: (u) => ({
        Name: u.user_name,
        Email: u.user_email,
        Type: u.user_type,
        Roles: (u.roles || []).join(", "),
        Country: u.country,
        Area: (u.area_section || []).join(", "),
        Status: u.status
    }),

    masterRequests: (r) => ({
        RequestNo: r.requestNo,
        User: r.userName,
        Amount: r.totalAmountSAR,
        Status: r.status,
        Role: r.currentRole
    })
};