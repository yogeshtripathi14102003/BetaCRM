// Lead table. Enum values yahan jaan-boojhkar hard-coded hain (migration ek snapshot hoti hai).
// Nayi status/source jodni ho to model ke arrays badlo AUR nayi migration me ALTER karo, is file ko edit mat karo.
const OPTS = { charset: 'utf8mb4', collate: 'utf8mb4_unicode_ci' };

const LEAD_STATUSES = ['New', 'Not Interested', 'Details Shared', 'Follow-up', 'Hot Lead', 'University Issue', 'Fee Issue', 'Distance Issue', 'Language Issue', 'Not Picked', 'Admission Done'];
const LEAD_SOURCES = ['Website Inquiry', 'Website Registration', 'Manual Upload', 'Imported Lead', 'Referral', 'Campaign', 'Other'];

module.exports = {
  async up(qi, { DataTypes: T }) {
    await qi.createTable(
      'leads',
      {
        id: { type: T.BIGINT.UNSIGNED, autoIncrement: true, primaryKey: true },

        name: { type: T.STRING(150), allowNull: false },
        phone: { type: T.STRING(20), allowNull: false },
        email: { type: T.STRING(254) },

        course: { type: T.STRING(200) },
        city: { type: T.STRING(100) },
        state: { type: T.STRING(100) },

        remark: { type: T.TEXT },
        action: { type: T.STRING(200) },

        referral_name: { type: T.STRING(150) },
        student_name: { type: T.STRING(150) },
        referral_mobile: { type: T.STRING(20) },

        branch: { type: T.STRING(150) },
        university_name: { type: T.STRING(200) },

        source: { type: T.ENUM(...LEAD_SOURCES), allowNull: false, defaultValue: 'Manual Upload' },

        assigned_at: { type: T.DATE },
        first_response_at: { type: T.DATE },
        last_follow_up_at: { type: T.DATE },
        lost_reason: { type: T.STRING(1000) },
        lead_score: { type: T.INTEGER.UNSIGNED, allowNull: false, defaultValue: 0 },
        resolved_at: { type: T.DATE },
        last_visited_at: { type: T.DATE },
        fired_automation_steps: { type: T.JSON, allowNull: false }, // default [] model se aata hai

        status: { type: T.ENUM(...LEAD_STATUSES), allowNull: false, defaultValue: 'New' },

        // users.id: user delete ho to lead bachi rahe (sirf assign hat jaata hai)
        assigned_to: {
          type: T.BIGINT.UNSIGNED,
          allowNull: true,
          references: { model: 'users', key: 'id' },
          onDelete: 'SET NULL',
          onUpdate: 'CASCADE',
        },
        assigned_to_name: { type: T.STRING(150) },

        follow_up_date: { type: T.DATE },
        reminder_date: { type: T.STRING(20) },
        reminder_time: { type: T.STRING(20) },

        created_at: { type: T.DATE, allowNull: false },
        updated_at: { type: T.DATE, allowNull: false },
      },
      OPTS
    );

    await qi.addIndex('leads', ['created_at']);
    await qi.addIndex('leads', ['assigned_to', 'created_at']);
    await qi.addIndex('leads', ['status', 'created_at']);
    await qi.addIndex('leads', ['phone']);
    await qi.addIndex('leads', ['state', 'city']);
    await qi.addIndex('leads', ['follow_up_date']);
  },

  async down(qi) {
    await qi.dropTable('leads');
  },
};